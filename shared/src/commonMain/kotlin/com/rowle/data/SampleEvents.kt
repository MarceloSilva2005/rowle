package com.rowle.data

import com.rowle.model.Event

val sampleEvents: List<Event>
    get() = Agenda.events

val nextEvents: List<Event>
    get() = sampleEvents.distinctBy { it.id }

fun eventById(id: String): Event? = sampleEvents.find { it.id == id }

val eventCategories: List<String>
    get() = sampleEvents.map { it.category }.distinct()

private val areaOrder = listOf("Norte", "Asa Sul", "Eixo", "Águas Claras", "Taguatinga")

val eventAreas: List<String>
    get() = areaOrder.filter { area -> sampleEvents.any { it.area == area } }

val agendaReady: Boolean
    get() = Agenda.ready
