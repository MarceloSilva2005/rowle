package com.rowle.data

import com.rowle.model.Event
import com.rowle.model.EventFact
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
                description = "Pinturas e esculturas inéditas de Daniel Toys, sobre memória e paisagem afetiva.",
                date = session.date,
                time = session.time,
                location = "Espaço Cultural Renato Russo — 508 Sul",
                area = "Asa Sul",
                category = "Cultura",
                price = "Grátis",
                link = "https://www.correiobraziliense.com.br/divirtasemais/2026/08/7482258-daniel-toys-busca-memorias-afetivas-e-sonhos-em-pinturas-e-esculturas.html",
                facts = listOf(
                    EventFact("Até", "27 de setembro"),
                    EventFact("Funciona", "Terça a domingo, 10h às 20h"),
                    EventFact("Sala", "Galeria Rubem Valentim")
                )
            )
        },
        orwell?.let { session ->
            Event(
                id = "orwell",
                title = "2+2=5",
                description = "Peça da Agrupação Teatral Amacaca, inspirada em 1984, de George Orwell. Direção de Felipe Vidal.",
                date = session.date,
                time = session.time,
                location = "Teatro dos Ventos — Águas Claras",
                area = "Águas Claras",
                category = "Teatro",
                price = "R$ 20",
                link = "https://www.sympla.com.br/evento/2-2-5-da-agrupacao-teatral-amacaca/3543915",
                ageRating = "14 anos",
                facts = listOf(
                    EventFact("Meia", "R$ 10"),
                    EventFact("Também", "Domingo 27, 16h e 19h"),
                    EventFact("Acesso", "Libras e audiodescrição no dia 27"),
                    EventFact("Quem", "Agrupação Teatral Amacaca")
                )
            )
        },
        aranha?.let { session ->
            Event(
                id = "aranha",
                title = "Aranhaverso",
                description = "O Homem-Aranha cai no multiverso. Espetáculo da Néia e Nando Cia. Teatral, para a família.",
                date = session.date,
                time = session.time,
                location = "Teatro Brasília Shopping — Asa Norte",
                area = "Norte",
                category = "Teatro",
                price = "R$ 40",
                link = "https://visitebrasilia.com.br/noticias/aranhaverso-leva-homem-aranha-e-aventura-pelo-multiverso-ao-teatro-brasilia-shopping",
                ageRating = "Livre",
                facts = listOf(
                    EventFact("Meia", "R$ 20"),
                    EventFact("Sessões", "26 e 27 de setembro, às 16h"),
                    EventFact("Bilheteria", "A partir das 15h, no teatro"),
                    EventFact("Quem", "Néia e Nando Cia. Teatral")
                )
            )
        },
        choro?.let { session ->
            Event(
                id = "choro",
                title = "Choro Permanente",
                description = "Roda ao ar livre na feira, com o grupo Saudando o Choro. Clássicos, autorais e convidados.",
                facts = listOf(
                    EventFact("Até", "12h"),
                    EventFact("Também", "Domingo, no mesmo horário"),
                    EventFact("Com", "Leo Araújo, Nelson Latif e Rosemaria"),
                    EventFact("Quem", "Saudando o Choro")
                ),
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
                description = "Sidney Magal canta Sandra Rosa Madalena, Meu Sangue Ferve por Você, Me Chama Que Eu Vou e clássicos para dançar. O valor do ingresso está na Blue Ticket.",
                facts = listOf(
                    EventFact("Portões", "19h30"),
                    EventFact("Sala", "Auditório Master"),
                    EventFact("Quem", "Sidney Magal")
                ),
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
