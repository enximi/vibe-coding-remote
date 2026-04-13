use std::path::Path;

fn main() {
    println!("cargo::rerun-if-changed=../../apps/web/dist");

    let index_file = Path::new("../../apps/web/dist/index.html");
    if !index_file.exists() {
        println!(
            "cargo::warning=apps/web/dist/index.html is missing. Run `bun run build:web` before building the desktop server."
        );
    }
}
