package com.rowle.data

import androidx.compose.runtime.Composable
import com.rowle.model.Event

fun eventShareText(event: Event): String = buildString {
    appendLine(event.title)
    eventSheet(event).forEach { fact ->
        appendLine("${fact.label}: ${fact.value}")
    }
    val url = event.link
    if (!url.isNullOrBlank()) appendLine(url)
    append("\nRowlê — Brasília")
}

fun interface Sharer {
    fun share(text: String)
}

@Composable
expect fun rememberSharer(): Sharer
