package com.rowle.data

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.rowle.model.Event
import com.rowle.model.EventFact
import com.rowle.model.FactKind
import com.rowle.resources.Res
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

const val AGENDA_URL =
    "https://raw.githubusercontent.com/MarceloSilva2005/rowle/main/shared/src/commonMain/composeResources/files/events.json"

private val agendaJson = Json { ignoreUnknownKeys = true }

object Agenda {
    var events by mutableStateOf<List<Event>>(emptyList())
        private set

    var ready by mutableStateOf(false)
        private set

    suspend fun load() {
        val bundled = Res.readBytes("files/events.json").decodeToString()
        val cached = readSavedAgenda()
        val initial = cached?.let { runCatching { parseAgenda(it) }.getOrNull() }
            ?: parseAgenda(bundled)
        events = initial
        ready = true

        val remote = withContext(Dispatchers.Default) { fetchAgenda(AGENDA_URL) }
        if (remote == null) return
        val parsed = runCatching { parseAgenda(remote) }.getOrNull() ?: return
        writeSavedAgenda(remote)
        events = parsed
    }
}

internal fun parseAgenda(raw: String, from: LocalDate = today()): List<Event> {
    val file = agendaJson.decodeFromString<AgendaFile>(raw)
    return file.events.flatMap { it.toEvents(from) }
        .sortedWith(compareBy({ it.date }, { it.time }, { it.title }))
}

@Serializable
private data class AgendaFile(
    val events: List<AgendaEntry>
)

@Serializable
private data class AgendaEntry(
    val id: String,
    val title: String,
    val description: String,
    val location: String,
    val area: String,
    val category: String,
    val price: String,
    val link: String? = null,
    val ageRating: String? = null,
    val sessions: List<AgendaSession> = emptyList(),
    val facts: List<AgendaFact> = emptyList()
)

@Serializable
private data class AgendaSession(
    val date: String,
    val time: String
)

@Serializable
private data class AgendaFact(
    val label: String,
    val value: String,
    val kind: String = "TEXT"
)

private fun AgendaEntry.toEvents(from: LocalDate): List<Event> {
    val upcoming = sessions
        .map { AgendaSlot(LocalDate.parse(it.date), parseAgendaTime(it.time)) }
        .filter { it.date >= from }
        .sortedWith(compareBy({ it.date }, { it.time }))
    return upcoming.map { slot ->
        Event(
            id = id,
            title = title,
            description = description,
            date = slot.date,
            time = slot.time,
            location = location,
            area = area,
            category = category,
            price = price,
            link = link,
            ageRating = ageRating,
            facts = facts.map { fact ->
                EventFact(fact.label, fact.value, factKind(fact.kind))
            }
        )
    }
}

private data class AgendaSlot(val date: LocalDate, val time: LocalTime)

private fun parseAgendaTime(value: String): LocalTime {
    val text = if (value.length == 5) "$value:00" else value
    return LocalTime.parse(text)
}

private fun factKind(value: String): FactKind = when (value.uppercase()) {
    "PRICE" -> FactKind.PRICE
    "STAMP" -> FactKind.STAMP
    else -> FactKind.TEXT
}
