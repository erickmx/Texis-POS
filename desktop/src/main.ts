import { invoke } from "@tauri-apps/api/core";

async function greet() {
  console.log(await invoke("greet", { name: "Texis POS" }));
}

greet();
