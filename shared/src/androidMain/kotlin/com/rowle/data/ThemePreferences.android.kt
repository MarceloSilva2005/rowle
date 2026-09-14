package com.rowle.data

import android.content.Context

internal object AndroidThemeStore {
    var appContext: Context? = null
}

fun initThemeStore(context: Context) {
    AndroidThemeStore.appContext = context.applicationContext
}

private fun prefs() =
    AndroidThemeStore.appContext?.getSharedPreferences("rowle", Context.MODE_PRIVATE)

internal actual fun readThemeName(): String? =
    prefs()?.getString("theme", null)

internal actual fun writeThemeName(name: String) {
    prefs()?.edit()?.putString("theme", name)?.apply()
}
