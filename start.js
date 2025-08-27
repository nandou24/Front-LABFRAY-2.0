const { exec } = require("child_process");

const port = process.env.PORT || 8080;
const command = `npx serve -s dist/front-labfray-2.0/browser -l ${port}`;

console.log(`🚀 Starting server on port ${port}`);
console.log(`📁 Serving from: dist/front-labfray-2.0/browser`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

const child = exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});

child.stdout.on("data", (data) => {
  console.log(data);
});

child.stderr.on("data", (data) => {
  console.error(data);
});
