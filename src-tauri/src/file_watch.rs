use std::{fs, path::Path, time::UNIX_EPOCH};

const MAX_MARKDOWN_BYTES: u64 = 16 * 1024 * 1024;
const MARKDOWN_EXTENSIONS: &[&str] = &["md", "markdown", "mdown", "mkdn", "txt"];

#[tauri::command]
pub fn file_fingerprint(path: String) -> Result<String, String> {
    fingerprint(Path::new(&path))
}

fn fingerprint(path: &Path) -> Result<String, String> {
    validate_markdown_extension(path)?;
    let metadata = fs::symlink_metadata(path).map_err(|_| "The file is no longer available.".to_owned())?;

    if metadata.file_type().is_symlink() {
        return Err("Symbolic-link paths are not monitored directly for safety.".to_owned());
    }
    if !metadata.is_file() {
        return Err("The selected path is not a regular file.".to_owned());
    }
    if metadata.len() > MAX_MARKDOWN_BYTES {
        return Err("The selected file exceeds Markora's safety limit.".to_owned());
    }

    let modified_ms = metadata
        .modified()
        .ok()
        .and_then(|value| value.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis())
        .unwrap_or(0);

    Ok(format!("{}:{modified_ms}", metadata.len()))
}

fn validate_markdown_extension(path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| "That file type is not supported.".to_owned())?;

    if MARKDOWN_EXTENSIONS.iter().any(|candidate| *candidate == extension) {
        Ok(())
    } else {
        Err("That file type is not supported.".to_owned())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fingerprints_regular_markdown_files() {
        let directory = tempfile::tempdir().expect("temporary directory");
        let path = directory.path().join("note.md");
        fs::write(&path, "hello").expect("seed file");

        let value = fingerprint(&path).expect("fingerprint");
        assert!(value.starts_with("5:"));
    }

    #[test]
    fn rejects_non_markdown_files() {
        let directory = tempfile::tempdir().expect("temporary directory");
        let path = directory.path().join("note.exe");
        fs::write(&path, "hello").expect("seed file");

        assert!(fingerprint(&path).is_err());
    }
}
