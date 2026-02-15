<?php

return [
    // Settings page - Display Settings
    'Display Settings' => 'Configuración de visualización',
    'Compact Mode' => 'Modo compacto',
    'Use a more compact display for search results and history lists.' => 'Usar una visualización más compacta para los resultados de búsqueda y las listas del historial.',
    'Show Section Filter' => 'Mostrar filtro de sección',
    'Show the section filter dropdown in the search UI.' => 'Mostrar el menú desplegable de filtro de sección en la interfaz de búsqueda.',
    'Show Entry Outline' => 'Mostrar esquema de entrada',
    'Display the entry outline button on entry pages.' => 'Mostrar el botón de esquema de entrada en las páginas de entrada.',
    'Show Related Entries' => 'Mostrar entradas relacionadas',
    'Display related entries button on entry pages.' => 'Mostrar botón de entradas relacionadas en páginas de entrada.',

    // Settings page - Search Settings
    'Search Settings' => 'Configuración de búsqueda',
    'Enabled Search Types' => 'Tipos de búsqueda habilitados',
    'Select which additional content types to show as tabs in the search overlay. Entries search is always enabled.' => 'Seleccione qué tipos de contenido adicionales mostrar como pestañas en el panel de búsqueda. La búsqueda de entradas está siempre habilitada.',
    'Enabled Sections' => 'Secciones habilitadas',
    'Select which sections should be searchable. Leave empty to enable all sections.' => 'Seleccione qué secciones deben ser buscables. Deje vacío para habilitar todas las secciones.',
    'Minimum Search Length' => 'Longitud mínima de búsqueda',
    'Minimum number of characters required before search is triggered.' => 'Número mínimo de caracteres requeridos antes de activar la búsqueda.',
    'Debounce Delay' => 'Retardo de rebote',
    'Delay in milliseconds before search is triggered after typing stops.' => 'Retardo en milisegundos antes de activar la búsqueda después de dejar de escribir.',

    // Settings page - History Settings
    'History Settings' => 'Configuración del historial',
    'History Limit' => 'Límite del historial',
    'Maximum number of entry visits to keep per user.' => 'Número máximo de visitas a entradas a conservar por usuario.',

    // Error messages
    'An error occurred while searching.' => 'Se produjo un error durante la búsqueda.',
    'An error occurred while fetching sections.' => 'Se produjo un error al obtener las secciones.',
    'An error occurred while fetching history.' => 'Se produjo un error al obtener el historial.',
    'An error occurred while recording the visit.' => 'Se produjo un error al registrar la visita.',
    'User not found.' => 'Usuario no encontrado.',

    // UI elements (passed to JavaScript)
    'Search entries...' => 'Buscar entradas...',
    'All Sections' => 'Todas las secciones',
    'Recent Entries' => 'Entradas recientes',
    'Filter history...' => 'Filtrar historial...',
    'No entries found' => 'No se encontraron entradas',
    'No recent entries' => 'No hay entradas recientes',
    'Searching...' => 'Buscando...',
    'Show more...' => 'Mostrar más...',
    'Go to last visited entry' => 'Ir a la última entrada visitada',
    'View recent entries' => 'Ver entradas recientes',
    'Open in new tab' => 'Abrir en nueva pestaña',
    '{count} Sections' => '{count} Secciones',
    '1 Section' => '1 Sección',

    // Related Entries
    'Related Entries' => 'Entradas relacionadas',
    'Links to' => 'Enlaza a',
    'Linked from' => 'Enlazado desde',
    'No related entries found' => 'No se encontraron entradas relacionadas',
    'An error occurred while fetching related entries.' => 'Se produjo un error al obtener las entradas relacionadas.',
    'Invalid entry ID.' => 'ID de entrada inválido.',

    // Entry Outline
    'Entry Outline' => 'Esquema de entrada',
    'No blocks found' => 'No se encontraron bloques',

    // Clear History
    'Clear history' => 'Borrar historial',
    'Clear all history?' => '¿Borrar todo el historial?',
    'This will remove all your recent entry visits. This action cannot be undone.' => 'Esto eliminará todas sus visitas recientes a entradas. Esta acción no se puede deshacer.',
    'An error occurred while clearing history.' => 'Se produjo un error al borrar el historial.',

    // Favorites
    'Favorites' => 'Favoritos',
    'Favorites Limit' => 'Límite de favoritos',
    'Maximum number of favorites per user.' => 'Número máximo de favoritos por usuario.',
    'Add to favorites' => 'Añadir a favoritos',
    'Remove from favorites' => 'Eliminar de favoritos',
    'No favorites yet' => 'Aún no hay favoritos',
    'Maximum favorites reached' => 'Máximo de favoritos alcanzado',
    'An error occurred while adding favorite.' => 'Se produjo un error al añadir el favorito.',
    'An error occurred while removing favorite.' => 'Se produjo un error al eliminar el favorito.',
    'An error occurred while fetching favorites.' => 'Se produjo un error al obtener los favoritos.',

    // Status tooltips
    'Status: Live' => 'Estado: Publicado',
    'Status: Draft' => 'Estado: Borrador',
    'Status: Pending' => 'Estado: Pendiente',
    'Status: Disabled' => 'Estado: Desactivado',
    'Status: Expired' => 'Estado: Expirado',

    // Section Filter Mode
    'Section Filter Mode' => 'Modo de filtro de sección',
    'Include selected sections' => 'Incluir secciones seleccionadas',
    'Exclude selected sections' => 'Excluir secciones seleccionadas',
    'Choose how to filter sections for search.' => 'Elija cómo filtrar las secciones para la búsqueda.',
    'Select which sections to exclude from search. Leave empty to search all sections.' => 'Seleccione qué secciones excluir de la búsqueda. Deje vacío para buscar en todas las secciones.',
    'Select which sections to include in search. Leave empty to search all sections.' => 'Seleccione qué secciones incluir en la búsqueda. Deje vacío para buscar en todas las secciones.',
    'Sections to Include' => 'Secciones a incluir',
    'Sections to Exclude' => 'Secciones a excluir',

    // Multi-site support
    'Current Site' => 'Sitio actual',
    'All Sites' => 'Todos los sitios',
    'An error occurred while fetching sites.' => 'Se produjo un error al obtener los sitios.',

    // Current page (favorites dropdown)
    'Current page' => 'Página actual',

    // Quick Access overlay
    'Quick Access' => 'Acceso rápido',
    'Search Results' => 'Resultados de búsqueda',
    'Filter...' => 'Filtrar...',
    'Enter ↵' => 'Intro ↵',
    'Close' => 'Cerrar',
    'Close drawer' => 'Cerrar panel',
    'Drag to reorder' => 'Arrastrar para reordenar',
    'Error loading history' => 'Error al cargar el historial',
    'Error loading favorites' => 'Error al cargar los favoritos',
    'Search failed' => 'La búsqueda falló',
    'No settings found' => 'No se encontraron ajustes',
    'History' => 'Historial',

    // Edit drawer
    'Edit Entry' => 'Editar entrada',
    'Title' => 'Título',
    'Slug' => 'Slug',
    'Status' => 'Estado',
    'Live' => 'Publicado',
    'Disabled' => 'Desactivado',
    'Draft' => 'Borrador',
    'Post Date' => 'Fecha de publicación',
    'Expiry Date' => 'Fecha de expiración',
    'Save' => 'Guardar',

    // Admin type labels
    'Section' => 'Sección',
    'Field' => 'Campo',
    'Entry Type' => 'Tipo de entrada',
    'Category Group' => 'Grupo de categorías',
    'Volume' => 'Volumen',
    'Global Set' => 'Conjunto global',
    'Plugin' => 'Plugin',

    // Tab labels for universal search
    'Entries' => 'Entradas',
    'Categories' => 'Categorías',
    'Assets' => 'Recursos',
    'Users' => 'Usuarios',
    'Globals' => 'Globales',
    'Admin' => 'Admin',

    // Search placeholders per type
    'Search categories...' => 'Buscar categorías...',
    'Search assets...' => 'Buscar recursos...',
    'Search users...' => 'Buscar usuarios...',
    'Search globals...' => 'Buscar globales...',
    'Search settings...' => 'Buscar ajustes...',

    // Empty states per type
    'No categories found' => 'No se encontraron categorías',
    'No assets found' => 'No se encontraron recursos',
    'No users found' => 'No se encontraron usuarios',
    'No global sets found' => 'No se encontraron conjuntos globales',
    'No admin results found' => 'No se encontraron ajustes',

    // Type prefix help
    'Type prefix hint' => 'Consejo: Use «entries:», «categories:», «users:», etc. para cambiar el tipo de búsqueda',

    'Clear Search on Tab Switch' => 'Limpiar búsqueda al cambiar pestaña',
    'Clear the search input and results when switching between search type tabs.' => 'Limpiar el campo de búsqueda y los resultados al cambiar entre pestañas de tipos de búsqueda.',
    'Clear search' => 'Limpiar búsqueda',

    // Saved Searches
    'Show Saved Searches' => 'Mostrar búsquedas guardadas',
    'Show the saved searches section in the Quick Access Overlay.' => 'Mostrar la sección de búsquedas guardadas en el panel de acceso rápido.',
    'Saved Searches' => 'Búsquedas guardadas',
    'Save Search' => 'Guardar búsqueda',
    'Name this search...' => 'Nombrar esta búsqueda...',
    'Run' => 'Ejecutar',
    'Delete saved search' => 'Eliminar búsqueda guardada',
    'Delete this saved search?' => '¿Eliminar esta búsqueda guardada?',
    'No saved searches yet' => 'Aún no hay búsquedas guardadas',
    'Maximum saved searches reached' => 'Máximo de búsquedas guardadas alcanzado',
    'Saved Searches Limit' => 'Límite de búsquedas guardadas',
    'Maximum number of saved searches per user.' => 'Número máximo de búsquedas guardadas por usuario.',
    'An error occurred while saving search.' => 'Se produjo un error al guardar la búsqueda.',
    'An error occurred while fetching saved searches.' => 'Se produjo un error al obtener las búsquedas guardadas.',
    'An error occurred while deleting saved search.' => 'Se produjo un error al eliminar la búsqueda guardada.',
    'An error occurred while reordering saved searches.' => 'Se produjo un error al reordenar las búsquedas guardadas.',

    // Favorites shortcuts
    'Navigating to {title}...' => 'Navegando a {title}...',

    // Copy actions
    'Copy options' => 'Opciones de copia',
    'Copy URL' => 'Copiar URL',
    'Copy Title' => 'Copiar título',
    'Copy ID' => 'Copiar ID',
    'Copied!' => '¡Copiado!',
];
