// Assina o build release com a chave de upload quando ela está configurada no
// ~/.gradle/gradle.properties da máquina (ROWLE_UPLOAD_*). Sem ela (CI), fica a de debug.
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_CONFIG = `
        release {
            if (findProperty('ROWLE_UPLOAD_STORE_FILE')) {
                storeFile file(findProperty('ROWLE_UPLOAD_STORE_FILE'))
                storePassword findProperty('ROWLE_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('ROWLE_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('ROWLE_UPLOAD_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes('ROWLE_UPLOAD_STORE_FILE')) return cfg;

    const signing = /signingConfigs\s*\{\s*debug\s*\{[^}]*\}/;
    if (!signing.test(gradle)) throw new Error('with-release-signing: bloco signingConfigs não encontrado');
    gradle = gradle.replace(signing, (block) => block + RELEASE_CONFIG);

    const release = /(release\s*\{[^{}]*?)signingConfig signingConfigs\.debug/;
    if (!release.test(gradle)) throw new Error('with-release-signing: signingConfig do release não encontrado');
    gradle = gradle.replace(
      release,
      "$1signingConfig findProperty('ROWLE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
