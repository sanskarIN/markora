const COMMANDS: &[&str] = &["read_text", "write_text", "persist_uri"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .build();
}
