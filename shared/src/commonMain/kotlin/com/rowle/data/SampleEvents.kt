package com.rowle.data

import com.rowle.model.Event

val sampleEvents = listOf(
    Event(
        id = "1",
        title = "Festival de Tecnologia de Brasília",
        description = "Palestras, oficinas e networking com a cena de tecnologia do DF. Aberto a estudantes, devs e curiosos.",
        date = "20 set",
        time = "14:00",
        location = "CIC — Asa Norte",
        category = "Tecnologia",
        price = "Grátis"
    ),
    Event(
        id = "2",
        title = "Show de Rock em Brasília",
        description = "Noite de bandas locais e clássicos do rock. Chegue cedo: o espaço costuma lotar no fim de semana.",
        date = "19 set",
        time = "20:00",
        location = "Asa Sul",
        category = "Shows",
        price = "R$ 40",
        ticketUrl = "https://www.sympla.com.br"
    ),
    Event(
        id = "3",
        title = "Feira Cultural de Brasília",
        description = "Arte, cultura, gastronomia e atrações para toda a família no Plano Piloto.",
        date = "21 set",
        time = "10:00",
        location = "Eixo Monumental",
        category = "Cultura",
        price = "Grátis"
    ),
    Event(
        id = "4",
        title = "Samba no Parque",
        description = "Roda de samba ao ar livre com comida de boteco e espaço para dançar. Entrada franca.",
        date = "20 set",
        time = "16:00",
        location = "Parque da Cidade",
        category = "Shows",
        price = "Grátis"
    ),
    Event(
        id = "5",
        title = "Mostra de Cinema no Cine Brasília",
        description = "Sessões de cinema brasileiro e debates com realizadores. Classificação indicativa na bilheteria.",
        date = "22 set",
        time = "19:30",
        location = "Cine Brasília — Asa Sul",
        category = "Cultura",
        price = "R$ 20"
    )
)

fun eventById(id: String): Event? = sampleEvents.find { it.id == id }

val eventCategories: List<String> = sampleEvents.map { it.category }.distinct()
