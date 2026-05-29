export const ADMIN_CRUD_TEMPLATES: Record<string, string> = {
  championships: `{
  "name": "Campeonato Paulista Sub-15",
  "slug": "paulista-sub-15",
  "season": "2026",
  "status": "ACTIVE",
  "description": "Campeonato oficial de base"
}`,
  categories: `{
  "championshipId": "COLE_O_ID_DO_CAMPEONATO",
  "name": "Sub-15",
  "slug": "sub-15",
  "ageGroup": "Sub-15",
  "gender": "M"
}`,
  groups: `{
  "categoryId": "COLE_O_ID_DA_CATEGORIA",
  "name": "Grupo A",
  "slug": "grupo-a"
}`,
  clubs: `{
  "name": "SE Palmeiras",
  "slug": "palmeiras",
  "shortName": "PAL",
  "city": "São Paulo",
  "state": "SP",
  "status": "APPROVED"
}`,
  athletes: `{
  "clubId": "COLE_O_ID_DO_CLUBE",
  "firstName": "João",
  "lastName": "Silva",
  "slug": "joao-silva",
  "birthDate": "2011-05-15T00:00:00.000Z",
  "position": "ST",
  "shirtNumber": 9,
  "category": "Sub-15",
  "status": "ACTIVE"
}`,
  matches: `{
  "groupId": "COLE_O_ID_DO_GRUPO",
  "homeTeamId": "ID_TIME_MANDANTE",
  "awayTeamId": "ID_TIME_VISITANTE",
  "round": 1,
  "scheduledAt": "2026-06-01T15:00:00.000Z",
  "venue": "Arena Barueri",
  "status": "SCHEDULED"
}`,
  news: `{
  "title": "Título da notícia",
  "slug": "titulo-da-noticia",
  "summary": "Resumo curto",
  "content": "Conteúdo completo da notícia",
  "category": "Campeonato",
  "isFeatured": false,
  "publishedAt": "2026-05-27T12:00:00.000Z"
}`,
  banners: `{
  "title": "Patrocinador exemplo",
  "subtitle": "Campanha opcional",
  "imageUrl": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200",
  "linkUrl": "https://exemplo.com",
  "placement": "HERO_CAROUSEL",
  "order": 0,
  "isActive": true
}`,
  documents: `{
  "clubId": "COLE_O_ID_DO_CLUBE",
  "type": "MEDICAL",
  "status": "PENDING",
  "fileUrl": "/uploads/documento.pdf",
  "fileName": "laudo-medico.pdf"
}`,
};

export const ADMIN_FIELD_HINTS: Record<string, string> = {
  championships: "name, slug, season, status (DRAFT|REGISTRATION|ACTIVE|FINISHED), description",
  categories: "championshipId, name, slug, ageGroup, gender",
  groups: "categoryId, name, slug",
  clubs: "name, slug, shortName, city, state, status (PENDING|APPROVED|REJECTED|SUSPENDED)",
  athletes: "clubId, firstName, lastName, slug, birthDate (ISO), position, shirtNumber, category, status",
  matches: "groupId, homeTeamId, awayTeamId, round, scheduledAt (ISO), venue, status",
  news: "title, slug, summary, content, category, isFeatured, publishedAt (ISO), imageUrl",
  banners: "title, subtitle, imageUrl, linkUrl, placement (HERO_CAROUSEL|SIDEBAR_LEFT|SIDEBAR_RIGHT), order, isActive, startsAt, endsAt",
  documents: "clubId, athleteId, type, status, fileUrl, fileName",
};
