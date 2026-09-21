package com.rowle.data

import com.rowle.model.Event
import com.rowle.model.EventFact
import com.rowle.model.FactKind

fun eventSheet(event: Event): List<EventFact> = buildList {
    add(EventFact("Quando", formatEventWhen(event.date, event.time)))
    add(EventFact("Onde", event.location))
    add(EventFact("Preço", event.price, FactKind.PRICE))
    val rating = event.ageRating
    if (!rating.isNullOrBlank()) {
        add(EventFact("Classificação", rating, FactKind.STAMP))
    }
    addAll(event.facts)
}
