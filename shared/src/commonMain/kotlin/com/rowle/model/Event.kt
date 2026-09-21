package com.rowle.model

import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime

data class EventFact(
    val label: String,
    val value: String,
    val kind: FactKind = FactKind.TEXT
)

enum class FactKind { TEXT, PRICE, STAMP }

data class Event(
    val id: String,
    val title: String,
    val description: String,
    val date: LocalDate,
    val time: LocalTime,
    val location: String,
    val area: String,
    val category: String,
    val price: String,
    val imageUrl: String? = null,
    val link: String? = null,
    val ageRating: String? = null,
    val facts: List<EventFact> = emptyList()
)
