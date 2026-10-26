plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.blockwho.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.blockwho.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "1.0.1"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            applicationIdSuffix = ""
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            assets.directories.add("src/main/assets")
        }
    }
}

kotlin {
    jvmToolchain(17)
}

// Auto-copy web assets from root project into Android assets
val copyWebAssets = tasks.register<Copy>("copyWebAssets") {
    from(file("../../index.html"), file("../../styles.css"), file("../../app.js"))
    into(file("src/main/assets"))
}

tasks.named("preBuild") {
    dependsOn(copyWebAssets)
}

dependencies {
    // Pure Android SDK without native .so libraries for 100% startup stability
}
