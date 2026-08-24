use serde::Serialize;
use std::{
    fmt,
    fs,
    io::Write,
    path::{Path, PathBuf},
};
use tempfile::NamedTempFile;
use url::Url;

const MAX_MARKDOWN_BYTES: u64 = 16 * 1024 * 1024;
const MAX_EXPORT_BYTES: usize = 32 * 1024 * 1024;
const MAX_BACKUP_BYTES: u64 = 4 * 1024 * 1024;
const MARKDOWN_EXTENSIONS: &[&str] = &["md", "markdown", "mdown", "mkdn", "txt"];
#[cfg(any(target_os = "android", target_os = "ios"))]
const MOBILE_PLUGIN_MESSAGE: &str = "This operation is handled by Markora's mobile file picker.";

#[derive(Debug)]
enum AppError {
    InvalidFileType,
    InvalidUrl,
    FileTooLarge,
    NotAFile,
    SymlinkNotAllowed,
    InvalidUtf8,
    Io,
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self {
            Self::InvalidFileType => "That file type is not supported.",
            Self::InvalidUrl => "That external link was blocked for safety.",
            Self::FileTooLarge => "The selected file exceeds Markora's safety limit.",
            Self::NotAFile => "The selected path is not a regular file.",
            Self::SymlinkNotAllowed => "Symbolic-link paths are not opened directly for safety.",
            Self::InvalidUtf8 => "The selected file is not valid UTF-8 text.",
            Self::Io => "The requested file operation could not be completed.",
        };
        f.write_str(message)
    }
}

impl From<std::io::Error> for AppError {
    fn from(_: std::io::Error) -> Self {
        Self::Io
    }
}

type CommandResult<T> = Result<T, String>;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenedFile {
    path: Option<String>,
    name: String,
    content: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedFile {
    path: Option<String>,
    name: String,
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
pub fn open_markdown_file() -> CommandResult<Option<OpenedFile>> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Markdown", &["md", "markdown", "mdown", "mkdn", "txt"])
        .pick_file()
    else {
        return Ok(None);
    };

    read_markdown(&path).map(Some).map_err(error_string)
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
pub fn open_markdown_file() -> CommandResult<Option<OpenedFile>> {
    Err(MOBILE_PLUGIN_MESSAGE.to_owned())
}

#[tauri::command]
pub fn read_markdown_file(path: String) -> CommandResult<OpenedFile> {
    read_markdown(Path::new(&path)).map_err(error_string)
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
pub fn save_markdown_file(
    path: Option<String>,
    content: String,
    suggested_name: String,
) -> CommandResult<Option<SavedFile>> {
    if content.len() as u64 > MAX_MARKDOWN_BYTES {
        return Err(AppError::FileTooLarge.to_string());
    }

    let target = match path {
        Some(value) => PathBuf::from(value),
        None => {
            let Some(chosen) = rfd::FileDialog::new()
                .set_file_name(&ensure_markdown_name(&suggested_name))
                .add_filter("Markdown", &["md"])
                .save_file()
            else {
                return Ok(None);
            };
            with_default_extension(chosen, "md")
        }
    };

    validate_extension(&target, MARKDOWN_EXTENSIONS).map_err(error_string)?;
    reject_symlink_if_existing(&target).map_err(error_string)?;
    atomic_write(&target, content.as_bytes()).map_err(error_string)?;

    Ok(Some(SavedFile {
        name: file_name(&target),
        path: Some(path_string(&target)),
    }))
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
pub fn save_markdown_file(
    _path: Option<String>,
    _content: String,
    _suggested_name: String,
) -> CommandResult<Option<SavedFile>> {
    Err(MOBILE_PLUGIN_MESSAGE.to_owned())
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
pub fn export_html_file(html: String, suggested_name: String) -> CommandResult<Option<String>> {
    if html.len() > MAX_EXPORT_BYTES {
        return Err(AppError::FileTooLarge.to_string());
    }

    let Some(path) = rfd::FileDialog::new()
        .set_file_name(&ensure_extension_name(&suggested_name, "html"))
        .add_filter("HTML", &["html", "htm"])
        .save_file()
    else {
        return Ok(None);
    };

    let target = with_default_extension(path, "html");
    validate_extension(&target, &["html", "htm"]).map_err(error_string)?;
    reject_symlink_if_existing(&target).map_err(error_string)?;
    atomic_write(&target, html.as_bytes()).map_err(error_string)?;
    Ok(Some(path_string(&target)))
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
pub fn export_html_file(_html: String, _suggested_name: String) -> CommandResult<Option<String>> {
    Err(MOBILE_PLUGIN_MESSAGE.to_owned())
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
pub fn save_backup_file(contents: String, suggested_name: String) -> CommandResult<Option<String>> {
    if contents.len() as u64 > MAX_BACKUP_BYTES {
        return Err(AppError::FileTooLarge.to_string());
    }

    let Some(path) = rfd::FileDialog::new()
        .set_file_name(&ensure_extension_name(&suggested_name, "json"))
        .add_filter("JSON", &["json"])
        .save_file()
    else {
        return Ok(None);
    };

    let target = with_default_extension(path, "json");
    validate_extension(&target, &["json"]).map_err(error_string)?;
    reject_symlink_if_existing(&target).map_err(error_string)?;
    atomic_write(&target, contents.as_bytes()).map_err(error_string)?;
    Ok(Some(path_string(&target)))
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
pub fn save_backup_file(_contents: String, _suggested_name: String) -> CommandResult<Option<String>> {
    Err(MOBILE_PLUGIN_MESSAGE.to_owned())
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
pub fn open_backup_file() -> CommandResult<Option<String>> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("JSON", &["json"])
        .pick_file()
    else {
        return Ok(None);
    };

    validate_extension(&path, &["json"]).map_err(error_string)?;
    validate_readable_file(&path, MAX_BACKUP_BYTES).map_err(error_string)?;
    let bytes = fs::read(path).map_err(|_| AppError::Io.to_string())?;
    String::from_utf8(bytes)
        .map(Some)
        .map_err(|_| AppError::InvalidUtf8.to_string())
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
pub fn open_backup_file() -> CommandResult<Option<String>> {
    Err(MOBILE_PLUGIN_MESSAGE.to_owned())
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[tauri::command]
pub fn open_external_url(url: String) -> CommandResult<()> {
    let parsed = validate_external_url(&url)?;
    open::that(parsed.as_str()).map_err(|_| AppError::Io.to_string())
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[tauri::command]
pub fn open_external_url(url: String) -> CommandResult<()> {
    validate_external_url(&url)?;
    Err(MOBILE_PLUGIN_MESSAGE.to_owned())
}

#[tauri::command]
pub fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_owned()
}

fn validate_external_url(url: &str) -> CommandResult<Url> {
    let parsed = Url::parse(url).map_err(|_| AppError::InvalidUrl.to_string())?;
    match parsed.scheme() {
        "http" | "https" | "mailto" => Ok(parsed),
        _ => Err(AppError::InvalidUrl.to_string()),
    }
}

fn read_markdown(path: &Path) -> Result<OpenedFile, AppError> {
    validate_extension(path, MARKDOWN_EXTENSIONS)?;
    validate_readable_file(path, MAX_MARKDOWN_BYTES)?;
    let bytes = fs::read(path)?;
    let content = String::from_utf8(bytes).map_err(|_| AppError::InvalidUtf8)?;

    Ok(OpenedFile {
        path: Some(path_string(path)),
        name: file_name(path),
        content,
    })
}

fn validate_readable_file(path: &Path, max_bytes: u64) -> Result<(), AppError> {
    let symlink_metadata = fs::symlink_metadata(path)?;
    if symlink_metadata.file_type().is_symlink() {
        return Err(AppError::SymlinkNotAllowed);
    }
    if !symlink_metadata.is_file() {
        return Err(AppError::NotAFile);
    }
    if symlink_metadata.len() > max_bytes {
        return Err(AppError::FileTooLarge);
    }
    Ok(())
}

fn reject_symlink_if_existing(path: &Path) -> Result<(), AppError> {
    match fs::symlink_metadata(path) {
        Ok(metadata) if metadata.file_type().is_symlink() => Err(AppError::SymlinkNotAllowed),
        Ok(metadata) if !metadata.is_file() => Err(AppError::NotAFile),
        Ok(_) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(_) => Err(AppError::Io),
    }
}

fn validate_extension(path: &Path, allowed: &[&str]) -> Result<(), AppError> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or(AppError::InvalidFileType)?;

    if allowed.iter().any(|candidate| *candidate == extension) {
        Ok(())
    } else {
        Err(AppError::InvalidFileType)
    }
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), AppError> {
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    if !parent.exists() || !parent.is_dir() {
        return Err(AppError::Io);
    }

    let mut temporary = NamedTempFile::new_in(parent)?;
    temporary.write_all(bytes)?;
    temporary.as_file_mut().sync_all()?;
    temporary.persist(path).map_err(|_| AppError::Io)?;
    Ok(())
}

fn with_default_extension(mut path: PathBuf, extension: &str) -> PathBuf {
    if path.extension().is_none() {
        path.set_extension(extension);
    }
    path
}

fn ensure_markdown_name(name: &str) -> String {
    let lower = name.to_ascii_lowercase();
    if MARKDOWN_EXTENSIONS
        .iter()
        .any(|extension| lower.ends_with(&format!(".{extension}")))
    {
        name.to_owned()
    } else {
        format!("{name}.md")
    }
}

fn ensure_extension_name(name: &str, extension: &str) -> String {
    if name.to_ascii_lowercase().ends_with(&format!(".{extension}")) {
        name.to_owned()
    } else {
        format!("{name}.{extension}")
    }
}

fn file_name(path: &Path) -> String {
    path.file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("Untitled.md")
        .to_owned()
}

fn path_string(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

fn error_string(error: AppError) -> String {
    error.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_supported_markdown_extensions_case_insensitively() {
        assert!(validate_extension(Path::new("notes.MD"), MARKDOWN_EXTENSIONS).is_ok());
        assert!(validate_extension(Path::new("notes.markdown"), MARKDOWN_EXTENSIONS).is_ok());
    }

    #[test]
    fn rejects_executable_extension() {
        assert!(validate_extension(Path::new("notes.exe"), MARKDOWN_EXTENSIONS).is_err());
    }

    #[test]
    fn adds_markdown_extension_when_missing() {
        assert_eq!(ensure_markdown_name("notes"), "notes.md");
        assert_eq!(ensure_markdown_name("notes.md"), "notes.md");
    }

    #[test]
    fn validates_external_urls_by_scheme() {
        assert!(validate_external_url("https://example.com").is_ok());
        assert!(validate_external_url("mailto:hello@example.com").is_ok());
        assert!(validate_external_url("file:///etc/passwd").is_err());
    }

    #[test]
    fn atomic_write_replaces_text_file() {
        let directory = tempfile::tempdir().expect("temporary directory");
        let path = directory.path().join("note.md");
        fs::write(&path, "old").expect("seed file");
        atomic_write(&path, b"new").expect("atomic write");
        assert_eq!(fs::read_to_string(path).expect("read file"), "new");
    }
}
