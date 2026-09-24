package com.rowle.data

import android.content.Context
import java.net.HttpURLConnection
import java.net.URL

private const val PREFS_NAME = "rowle"
private const val KEY_AGENDA = "agenda_json"

private var appContext: Context? = null

fun bindAgendaContext(context: Context) {
    appContext = context.applicationContext
}

internal actual fun readSavedAgenda(): String? {
    val context = appContext ?: return null
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(KEY_AGENDA, null)
}

internal actual fun writeSavedAgenda(json: String) {
    val context = appContext ?: return
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit()
        .putString(KEY_AGENDA, json)
        .apply()
}

internal actual fun fetchAgenda(url: String): String? = runCatching {
    val connection = URL(url).openConnection() as HttpURLConnection
    connection.connectTimeout = 8000
    connection.readTimeout = 8000
    connection.instanceFollowRedirects = true
    connection.setRequestProperty("User-Agent", "Rowle")
    connection.connect()
    if (connection.responseCode !in 200..299) return@runCatching null
    connection.inputStream.bufferedReader().use { it.readText() }
}.getOrNull()
