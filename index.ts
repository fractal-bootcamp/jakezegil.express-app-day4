import express from "express";
import path from "path";
import cors from "cors";
import { AUTH_SECRET, authenticate } from "./backend/middleware";
import { genSalt, hash, hashSync } from "bcrypt";
import { createHmac } from "crypto";
import { sign } from "jsonwebtoken";

const app = express();
app.use(cors());

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, key) => acc && acc[key], obj);
};

const processIfStatements = (
  template: string,
  variables: Record<string, any>
): string => {
  const ifRegex = /{%\s*if\s+([.\w]+)\s*%}([\s\S]*?){%\s*endif\s*%}/g;
  return template.replace(ifRegex, (match, condition, content) => {
    const value = getNestedValue(variables, condition);
    return value ? content : "";
  });
};

const processForLoops = (
  template: string,
  variables: Record<string, any>
): string => {
  const forRegex =
    /{%\s*for\s+(\w+)\s+in\s+([.\w]+)\s*%}([\s\S]*?){%\s*endfor\s*%}/g;
  return template.replace(forRegex, (match, item, list, content) => {
    const listValue = getNestedValue(variables, list);
    if (Array.isArray(listValue)) {
      return listValue
        .map((itemValue: any) => {
          return processVariables(content, { [item]: itemValue });
        })
        .join("");
    }
    return "";
  });
};

const processVariables = (
  template: string,
  variables: Record<string, any>
): string => {
  const variableRegex = /{{([\s\S]*?)}}/g;
  return template.replace(variableRegex, (match, path) => {
    const trimmedPath = path.trim();
    const value = getNestedValue(variables, trimmedPath);
    return value !== undefined ? String(value) : "";
  });
};

const injectTemplateVariables = (
  template: string,
  variables: Record<string, any>
): string => {
  let result = template;
  result = processIfStatements(result, variables);
  result = processForLoops(result, variables);
  result = processVariables(result, variables);
  return result;
};

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// In-memory storage for messages
let messages: { name: string; content: string }[] = [];

app.get("/", (req, res) => {
  const templatePath = path.join(__dirname, "templates", "index.html");
  const fs = require("fs");

  const template = fs.readFileSync(templatePath, "utf8");

  const html = injectTemplateVariables(template, {
    title: "Message Board",
    heading: "Welcome to the Message Board",
    messages,
  });
  res.send(html);
});

app.get("/messages/:name", (req, res) => {
  const messagesFromName = messages.filter((message) => {
    return message.name === req.params.name;
  });

  res.json(messagesFromName);
});

app.get("/messages", (req, res) => {
  res.json(messages);
});

app.post("/submit", (req, res) => {
  const { name, message } = req.body;

  messages.push({ name, content: message });

  res.redirect("/");
});

const users = {
  "1": {
    name: "John",
    password: "123456",
  },
  "2": {
    name: "Jane",
    password: "123456",
  },
};

const generateToken = async (id: string) => {
  const token = sign({ id }, AUTH_SECRET);
  return token;
};

app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const foundEntry = Object.entries(users).find(([, user]) => user.name === name);
  const user = foundEntry ? foundEntry[1] : undefined;
  const id = foundEntry ? foundEntry[0] : undefined;
  if (!id) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  
  if (user && user.password === password) {
    res
      .status(200)
      .json({ message: "Authenticated", token: await generateToken(id) });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.get("/authenticated", authenticate, (req, res) => {
  const { name } = users[req.user.id];

  res.send(name + " is authenticated");
});

app.listen(3000, () => console.log("Server running on port 3000"));
