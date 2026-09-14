package com.rowle.model

data class Event(
    val id: String,
    val title: String,
    val description: String,
    val date: String,
    val time: String,
    val location: String,
    val category: String,
    val price: String,
    val imageUrl: String? = null,
    val ticketUrl: String? = null
)
