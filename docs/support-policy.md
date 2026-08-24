# Markora compatibility and support policy

This document defines the compatibility target for Markora's stable desktop release and separates supported release use from development-only or preview targets.

## Stable desktop support target

Markora v1.x targets the following desktop families:

| Platform | Stable target | Verification expectation |
| --- | --- | --- |
| Windows | Windows 11; Windows 10 with a supported WebView2 runtime is best-effort | CI build plus packaged smoke test on Windows before release |
| macOS | Recent maintained macOS releases supported by the current Tauri 2 toolchain | CI build plus packaged smoke test on macOS before release |
| Linux | Modern distributions capable of WebKitGTK 4.1; Ubuntu 22.04 / Debian 12-class baselines are representative | CI build plus packaged smoke test on Linux before release |

Operating-system vendor support still matters. A platform being technically capable of running Tauri does not mean Markora can promise security support after the OS vendor or webview runtime no longer provides security updates.

## Webview/runtime expectations

Markora uses the operating system's webview instead of shipping a browser engine with the application:

- Windows uses Microsoft Edge WebView2.
- macOS uses the platform WebKit webview.
- Linux uses WebKitGTK 4.1.

Users should keep the operating system and webview/runtime packages updated. Markora does not pin users to an intentionally obsolete webview for visual consistency.

## Android status

Android is a supported project target with its own build/test path, but the v1.0 milestone in `ROADMAP.md` is the stable **desktop** release milestone. Android release readiness is tracked separately in `docs/android.md` and requires physical-device and signed-package verification before a production mobile release is claimed.

## Browser mode

The Vite/browser build is a development and automated-test surface. It is not a separately supported hosted Markora product.

Browser mode intentionally cannot provide all native file/recent-file behaviors available in the packaged desktop application.

## Architectures

The release workflow uses GitHub-hosted platform runners and the architectures provided by the resulting Tauri bundles. A release should list the exact architectures actually attached to GitHub Releases instead of implying an architecture was tested when no artifact exists.

Additional architectures can be accepted after their build and smoke-test path is repeatable.

## Stable release support window

After v1.0.0:

- `main` receives ongoing development and security fixes.
- The latest stable v1.x release line receives security and data-loss fixes.
- Users on older v1.x patch releases may be asked to upgrade to the newest patch release rather than receive backports.
- Preview/prerelease builds are best-effort and are not a long-term support channel.
- A future v2 release must update this policy before support for v1 is ended.

The project does not currently promise a fixed number of years of support. Support depends on maintained OS/webview/toolchain dependencies and maintainer capacity.

## Compatibility promises

Within a stable major release, Markora aims to preserve:

- Markdown document compatibility;
- safe recovery of supported workspace snapshot versions;
- documented backup import compatibility or an explicit migration path;
- normal open/save/export behavior for supported Markdown/text files;
- accessibility semantics for core journeys;
- local-first behavior and the documented security boundaries.

A security or data-integrity fix may intentionally reject inputs that an older version accepted unsafely.

## What is not guaranteed

Markora does not guarantee:

- byte-identical PDF output across operating-system print engines;
- identical fonts/rendering when different local fonts or webview versions are installed;
- support for obsolete operating systems after their security/runtime dependencies become unsafe to support;
- unrestricted access to network drives, virtual filesystems, sandboxed provider URIs, or unusual filesystem semantics that cannot satisfy Markora's validation rules;
- cloud synchronization or account-based migration.

## Reporting compatibility problems

For normal support issues, include:

- Markora version;
- OS version and architecture;
- installation/package type;
- webview/runtime version if relevant;
- minimal reproduction steps using non-sensitive Markdown;
- expected and actual behavior.

Do not attach private documents, credentials, access tokens, signing keys, or personal filesystem paths when a synthetic example is sufficient.

Security reports should follow `SECURITY.md` and should not be filed publicly when disclosure would put users at risk.

## Release gate

A platform is listed as verified for a release only after its packaged artifact has been installed, launched, exercised through the release smoke test, and uninstalled successfully. CI compilation alone is not enough to claim runtime verification.

**Made by the Sanskar**
