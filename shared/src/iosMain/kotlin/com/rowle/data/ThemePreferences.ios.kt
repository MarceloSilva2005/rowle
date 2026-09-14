package com.rowle.data

import platform.Foundation.NSUserDefaults

private const val KEY = "theme"

internal actual fun readThemeName(): String? =
    NSUserDefaults.standardUserDefaults.stringForKey(KEY)

internal actual fun writeThemeName(name: String) {
    NSUserDefaults.standardUserDefaults.setObject(name, forKey = KEY)
}
