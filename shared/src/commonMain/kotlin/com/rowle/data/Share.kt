package com.rowle.data

import androidx.compose.runtime.Composable
import com.rowle.model.Event

fun eventShareText(event: Event): String = buildString {
    appendLine(event.title)
    appendLine(formatEventWhen(event.date, event.time))
    append(event.location)
    append("  ·  ")
    append(event.price)
    val url = event.link
    if (!url.isNullOrBlank()) {
        append('\n')
        append(url)
    }
    append("\n\nRowlê — Brasília")
}

fun interface Sharer {
    fun share(text: String)
}

@Composable
expect fun rememberSharer(): Sharer
