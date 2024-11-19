// executeCode.js

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

async function executeCode(problemId, code, language, input) {
  const executionId = `${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const workDirHost = path.join("/tmp", executionId);
  fs.mkdirSync(workDirHost);

  // Write user code to a file
  const codeFileName = getCodeFileName(language);
  const codeFilePathHost = path.join(workDirHost, codeFileName);
  fs.writeFileSync(codeFilePathHost, code);

  // Prepare Docker command
  const dockerImage = getDockerImage(language);
  const command = getExecutionCommand(language, codeFileName, input);
  const dockerCommand = `
    docker run --rm \
    --net none \
    --memory="256m" \
    --cpus="0.5" \
    -v "${workDirHost}:/app" \
    -w "/app" \
    ${dockerImage} \
    /bin/sh -c "${command}"
  `;

  return new Promise((resolve, reject) => {
    exec(dockerCommand, { timeout: 5000 }, (error, stdout, stderr) => {
      // Clean up
      fs.rmdirSync(workDirHost, { recursive: true });

      if (error) {
        // Time Limit Exceeded
        if (error.killed || error.signal === "SIGTERM") {
          return resolve({ status: "Time Limit Exceeded", details: null });
        }

        // Check for Memory Limit Exceeded
        if (stderr.includes("memory") || stderr.includes("out of memory")) {
          return resolve({ status: "Memory Limit Exceeded", details: null });
        }

        // Compilation Error or Runtime Error
        if (stderr) {
          // Distinguish between Compilation and Runtime errors
          if (isCompilationError(stderr, language)) {
            return resolve({ status: "Compilation Error", details: stderr });
          } else {
            return resolve({ status: "Runtime Error", details: stderr });
          }
        }

        // Other Errors
        return resolve({ status: "Error", details: stderr || error.message });
      }

      // Execution Success
      resolve({ status: "Success", output: stdout.trim() });
    });
  });
}

function getCodeFileName(language) {
  switch (language) {
    case "python":
      return "Solution.py";
    case "javascript":
      return "Solution.js";
    case "java":
      return "Solution.java";
    case "c++":
      return "Solution.cpp";
    // Add other languages as needed
  }
}

function getDockerImage(language) {
  switch (language) {
    case "python":
      return "python:3.9-alpine";
    case "javascript":
      return "node:14-alpine";
    case "java":
      return "openjdk:11-jdk-slim";
    case "c++":
      return "gcc:10.2-buster";
    // Add other languages as needed
  }
}

function getExecutionCommand(language, codeFileName, input) {
  switch (language) {
    case "python":
      return `timeout 5 python ${codeFileName} <<EOF
${input}
EOF`;
    case "javascript":
      return `timeout 5 node ${codeFileName} <<EOF
${input}
EOF`;
    case "java":
      return `javac ${codeFileName} && timeout 5 java ${
        codeFileName.split(".")[0]
      } <<EOF
${input}
EOF`;
    case "c++":
      return `g++ ${codeFileName} -o Solution && timeout 5 ./Solution <<EOF
${input}
EOF`;
    // Add other languages as needed
  }
}

function isCompilationError(stderr, language) {
  // Implement language-specific compilation error detection
  switch (language) {
    case "java":
      return stderr.includes("error:");
    case "c++":
      return stderr.includes("error:");
    // For interpreted languages, there is no compilation error
    default:
      return false;
  }
}

module.exports = { executeCode };
