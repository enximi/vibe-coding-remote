use std::path::Path;

fn main() {
    println!("cargo::rerun-if-changed=frontend/dist");

    let index_file = Path::new("frontend/dist/index.html");
    if !index_file.exists() {
        println!(
            "cargo::warning=frontend/dist/index.html is missing. Run `cd frontend && bun run build` before building a release binary."
        );
    }
}
