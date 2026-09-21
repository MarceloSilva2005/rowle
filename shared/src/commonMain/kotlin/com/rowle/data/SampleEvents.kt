package com.rowle.data

import com.rowle.model.Event
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.DayOfWeek
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.datetime.plus

private data class Session(val date: LocalDate, val time: LocalTime)

private fun nextSession(sessions: List<Session>, from: LocalDate = today()): Session? =
    sessions.filter { it.date >= from }.minWithOrNull(compareBy({ it.date }, { it.time }))

private fun openDays(start: LocalDate, end: LocalDate, closed: Set<DayOfWeek>): List<LocalDate> {
    val days = mutableListOf<LocalDate>()
    var date = start
    while (date <= end) {
        if (date.dayOfWeek !in closed) days += date
        date = date.plus(1, DateTimeUnit.DAY)
    }
    return days
}

private fun sampleEventsList(): List<Event> {
    val toys = nextSession(
        openDays(
            start = LocalDate(2026, 8, 18),
            end = LocalDate(2026, 9, 27),
            closed = setOf(DayOfWeek.MONDAY)
        ).map { Session(it, LocalTime(10, 0)) }
    )
    val orwell = nextSession(
        listOf(
            Session(LocalDate(2026, 9, 25), LocalTime(20, 0)),
            Session(LocalDate(2026, 9, 27), LocalTime(16, 0))
        )
    )
    val aranha = nextSession(
        listOf(
            Session(LocalDate(2026, 9, 26), LocalTime(16, 0)),
            Session(LocalDate(2026, 9, 27), LocalTime(16, 0))
        )
    )
    val choro = nextSession(
        listOf(
            Session(LocalDate(2026, 9, 26), LocalTime(10, 0)),
            Session(LocalDate(2026, 9, 27), LocalTime(10, 0))
        )
    )
    val magal = nextSession(
        listOf(Session(LocalDate(2026, 9, 26), LocalTime(21, 0)))
    )

    return listOfNotNull(
        toys?.let { session ->
            Event(
                id = "toys",
                title = "O Que Nos Habita",
                description = "Pinturas e esculturas inéditas de Daniel Toys na Galeria Rubem Valentim. Entrada franca até 27 de setembro, de terça a domingo, das 10h às 20h.",
                date = session.date,
                time = session.time,
                location = "Espaço Cultural Renato Russo — 508 Sul",
                area = "Asa Sul",
                category = "Cultura",
                price = "Grátis",
                link = "https://www.correiobraziliense.com.br/divirtasemais/2026/08/7482258-daniel-toys-busca-memorias-afetivas-e-sonhos-em-pinturas-e-esculturas.html"
            )
        },
        orwell?.let { session ->
            Event(
                id = "orwell",
                title = "2+2=5",
                description = "A Agrupação Teatral Amacaca reencena a peça inspirada em 1984, de George Orwell. Sexta às 20h. Domingo, 27 de setembro, às 16h e às 19h — essa sessão com Libras e audiodescrição. Inteira R$ 20, meia R$ 10. Classificação 14 anos.",
                date = session.date,
                time = session.time,
                location = "Teatro dos Ventos — Águas Claras",
                area = "Águas Claras",
                category = "Teatro",
                price = "R$ 20",
                link = "https://www.sympla.com.br/evento/2-2-5-da-agrupacao-teatral-amacaca/3543915"
            )
        },
        aranha?.let { session ->
            Event(
                id = "aranha",
                title = "Aranhaverso",
                description = "A Néia e Nando Cia. Teatral leva o Homem-Aranha ao multiverso. Sessões em 26 e 27 de setembro, às 16h, no Teatro Brasília Shopping. Inteira R$ 40, meia R$ 20. Classificação livre. Bilheteria do teatro a partir das 15h.",
                date = session.date,
                time = session.time,
                location = "Teatro Brasília Shopping — Asa Norte",
                area = "Norte",
                category = "Teatro",
                price = "R$ 40",
                link = "https://visitebrasilia.com.br/noticias/aranhaverso-leva-homem-aranha-e-aventura-pelo-multiverso-ao-teatro-brasilia-shopping"
            )
        },
        choro?.let { session ->
            Event(
                id = "choro",
                title = "Choro Permanente",
                description = "Roda do grupo Saudando o Choro na Feira Permanente de Taguatinga. Sábados e domingos de setembro, das 10h às 12h. Nos dias 26 e 27, participações de Leo Araújo, Nelson Latif e Rosemaria. Entrada franca.",
                date = session.date,
                time = session.time,
                location = "Feira Permanente de Taguatinga — QNL",
                area = "Taguatinga",
                category = "Shows",
                price = "Grátis",
                link = "https://www.correiobraziliense.com.br/diversao-e-arte/2026/09/7497060-saudando-o-choro-ocupa-feira-em-taguatinga-ate-o-fim-de-setembro.html"
            )
        },
        magal?.let { session ->
            Event(
                id = "magal",
                title = "Baile do Magal",
                description = "Sidney Magal no Auditório Master, com sucessos como Sandra Rosa Madalena, Meu Sangue Ferve por Você e Me Chama Que Eu Vou. Portões às 19h30, show às 21h. O valor do ingresso está na Blue Ticket.",
                date = session.date,
                time = session.time,
                location = "Centro de Convenções Ulysses Guimarães",
                area = "Eixo",
                category = "Shows",
                price = "Ver ingresso",
                link = "https://www.blueticket.com.br/evento/41228"
            )
        }
    ).sortedWith(compareBy({ it.date }, { it.time }))
}

val sampleEvents: List<Event> = sampleEventsList()

fun eventById(id: String): Event? = sampleEvents.find { it.id == id }

val eventCategories: List<String> = sampleEvents.map { it.category }.distinct()

private val areaOrder = listOf("Norte", "Asa Sul", "Eixo", "Águas Claras", "Taguatinga")

val eventAreas: List<String> = areaOrder.filter { area -> sampleEvents.any { it.area == area } }
