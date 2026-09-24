package com.rowle.data

internal expect fun readSavedAgenda(): String?

internal expect fun writeSavedAgenda(json: String)

internal expect fun fetchAgenda(url: String): String?
