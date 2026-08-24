# Markora signing and notarization strategy

This document defines the credential boundary for signed Markora releases. The repository must remain buildable without private signing credentials, while public production artifacts should use platform-appropriate signing when credentials are available.

## Principles

1. Signing credentials are release secrets, never source files.
2. Pull-request CI must not receive production signing secrets.
3. Unsigned CI artifacts are verification artifacts, not automatically trusted public releases.
4. A signed artifact must still pass the same functional/security smoke tests as an unsigned build.
5. Compromise, expiry, or rotation of a signing identity must not require rewriting source history.

Tauri's current distribution guidance states that most platforms require code signing and provides platform-specific signing paths. Reference: https://v2.tauri.app/distribute/

## GitHub Actions boundary

Production signing should use protected GitHub Environments or equivalent release-only secret storage. Secrets should be available only to the tag/release workflow after repository/environment protections are satisfied.

Do not expose signing credentials to:

- pull requests from forks;
- normal CI jobs;
- browser/E2E tests;
- issue automation;
- generated build artifacts;
- logs or release notes.

The current `.github/workflows/release.yml` intentionally builds draft releases without requiring credentials. Credential-aware signing can be added when the project owns the necessary identities, but absence of secrets must never cause a workflow to print or synthesize placeholder private material.

## Windows

Public Windows installers should be Authenticode-signed using a trusted code-signing identity or an approved managed signing service.

Tauri supports certificate-thumbprint/signing configuration and custom signing commands. Current guidance: https://v2.tauri.app/distribute/sign/windows/

Recommended release model:

- store certificate/private-key material or managed-signing credentials only in protected release secrets;
- import/access the identity only on the Windows release runner;
- sign the produced executable/installer through the Tauri-supported signing path;
- use SHA-256 and a trusted timestamp service where required by the chosen certificate/provider;
- verify the signature on the final downloadable artifact before publishing the draft release.

If a certificate must be imported on a runner, remove temporary decoded certificate files before the job completes and ensure they are never uploaded as artifacts.

Do not ask users to bypass SmartScreen or signature warnings for an unverified public build.

## macOS

Public direct-download macOS builds should use an Apple Developer ID Application identity and notarization. Tauri's current macOS signing/notarization guidance: https://v2.tauri.app/distribute/sign/macos/

Recommended release model:

- keep the signing certificate/private key in protected release-secret storage;
- keep Apple notarization authentication (App Store Connect API key or supported Apple credentials) in protected release secrets;
- sign on the macOS runner;
- submit the signed artifact for notarization;
- staple notarization results when the distribution format supports it;
- verify with macOS signing/Gatekeeper tools before release publication.

Tauri also documents ad-hoc signing for builds without an Apple-authenticated identity. Ad-hoc signing can help development/testing, especially on Apple Silicon, but it is not a substitute for Developer ID signing and notarization for a normal public direct-download release.

## Linux

Linux distribution trust varies by package/channel. Markora should publish checksums for release assets and use the signing mechanism appropriate to the chosen distribution channel.

For AppImage, Tauri documents GPG-based signing options: https://v2.tauri.app/distribute/sign/linux/

For repository-based packages, follow the repository/package-manager signing model rather than inventing a second incompatible trust mechanism.

Do not claim a Linux artifact is signed unless the downloadable artifact or distribution metadata can be independently verified using the documented public key/trust path.

## Android

Android production distribution is separate from the desktop v1.0 milestone. Release APK/AAB files must be signed with an Android upload/release key as appropriate to the distribution channel.

Tauri guidance: https://v2.tauri.app/distribute/sign/android/

The keystore, passwords, aliases, and generated `keystore.properties` containing secrets must not be committed. See `docs/android.md` for the Android release checklist.

## Secret names and configuration

This repository intentionally does not require one fixed secret naming convention until signing is enabled, because certificate/provider choice affects the required values. When signing automation is implemented:

- document the required secret **names** only;
- never document secret values;
- avoid placing long-lived credentials in repository variables that are readable by normal workflows;
- prefer short-lived/federated credentials where the signing provider supports them;
- restrict environment access to trusted maintainers/release automation.

## Verification requirements

Before publishing a signed artifact, record:

- release tag and commit SHA;
- artifact filename and checksum;
- signing identity/provider (non-secret identifier only);
- signature verification result;
- notarization result where applicable;
- installation/launch result on the target OS;
- uninstall result;
- date of verification.

A signature proves artifact origin/integrity under the signing identity; it does not replace malware scanning, tests, dependency review, or application security review.

## Rotation and compromise

If a signing credential is suspected compromised:

1. stop publication using that identity;
2. revoke/disable it through the issuer/provider where possible;
3. rotate repository/environment secrets;
4. audit release workflow access and recent releases;
5. communicate affected release trust status clearly;
6. sign replacement releases with a new identity/version instead of silently replacing a published binary under the same tag.

Expired credentials should be rotated before they block an urgent security release.

## Current v1.0 gate

The signing strategy is documented, but production signing/notarization cannot be marked verified until real project-owned credentials are configured and the resulting artifacts are independently checked. The release workflow should remain draft-first until that verification is complete.

**Made by the Sanskar**
