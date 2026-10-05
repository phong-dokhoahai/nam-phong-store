import { existsSync, readFileSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dokhoahaiphong@gmail.com";
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || "Admin";
const REQUIRED_ENV = ["SUPABASE_SERVICE_ROLE_KEY"];

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [
  ...(!supabaseUrl ? ["SUPABASE_URL or VITE_SUPABASE_URL"] : []),
  ...REQUIRED_ENV.filter((name) => !process.env[name]),
];

if (missing.length > 0) {
  fail(`Missing required environment variable(s): ${missing.join(", ")}`);
}

const adminPassword = await getAdminPassword();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const existingUser = await findUserByEmail(ADMIN_EMAIL);
const user = existingUser
  ? await updateAuthUser(existingUser.id, adminPassword)
  : await createAuthUser(ADMIN_EMAIL, adminPassword);

await ensureAdminProfile(user.id);

console.info(`Admin bootstrap complete for ${ADMIN_EMAIL}.`);

function loadLocalEnv() {
  if (!existsSync(".env")) {
    return;
  }

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!match || match[1] === "ADMIN_PASSWORD" || process.env[match[1]] !== undefined) {
      continue;
    }

    process.env[match[1]] = unquoteEnvValue(match[2] || "");
  }
}

function unquoteEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

async function getAdminPassword() {
  if (process.env.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }

  if (!input.isTTY) {
    fail("Missing required environment variable(s): ADMIN_PASSWORD");
  }

  const password = await readHiddenLine("ADMIN_PASSWORD: ");
  if (!password) {
    fail("ADMIN_PASSWORD must not be empty");
  }

  return password;
}

function readHiddenLine(prompt) {
  return new Promise((resolve) => {
    let value = "";
    const wasRaw = input.isRaw;

    output.write(prompt);
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.resume();

    const onKeypress = (chunk, key) => {
      if (key?.name === "return" || key?.name === "enter") {
        output.write("\n");
        cleanup();
        resolve(value);
        return;
      }

      if (key?.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }

      if (key?.ctrl && key.name === "c") {
        output.write("\n");
        cleanup();
        process.exit(130);
      }

      if (chunk) {
        value += chunk;
      }
    };

    const cleanup = () => {
      input.off("keypress", onKeypress);
      input.setRawMode(wasRaw);
      input.pause();
    };

    input.on("keypress", onKeypress);
  });
}

async function findUserByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user) {
      return user;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }
}

async function createAuthUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN_FULL_NAME,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function updateAuthUser(userId, password) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN_FULL_NAME,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function ensureAdminProfile(userId) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: ADMIN_FULL_NAME,
      role: "ADMIN",
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
