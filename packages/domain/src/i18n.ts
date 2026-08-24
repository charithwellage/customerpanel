/**
 * CarChief Internationalization (i18n) and Globalization Catalog.
 * Provides supported language definitions, translation dictionaries, and
 * fallback interpolation utilities across public-web and customer-app.
 */

export type LanguageCode = 'en' | 'ja' | 'es' | 'fr' | 'sw' | 'pt' | 'ru' | 'ar';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', direction: 'ltr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', flag: '🇰🇪', direction: 'ltr' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹', direction: 'ltr' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺', direction: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇦🇪', direction: 'rtl' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export type TranslationDictionary = Record<string, string>;

export const TRANSLATION_DICTIONARIES: Record<LanguageCode, TranslationDictionary> = {
  en: {
    // Top Bar & Utility
    'header.japanTime': 'Japan Time: JST (UTC+9)',
    'header.carsInStock': 'Total Cars in Stock: 68,000+',
    'header.countrySelect': 'Select Country / Destination Port',
    'header.currencySelect': 'Select Currency',
    'header.languageSelect': 'Select Language',
    'header.skipLink': 'Skip to main content',
    'header.searchPlaceholder': 'Search by make, model, stock # or keywords...',
    'header.searchButton': 'Search',
    'header.allCategories': 'All Makes',
    'header.login': 'Login',
    'header.register': 'Register',
    'header.online': 'ONLINE',

    // Navigation
    'nav.home': 'Home',
    'nav.inventory': 'All Stock',
    'nav.services': 'Services',
    'nav.howToBuy': 'How to Buy',
    'nav.clearance': 'Clearance Stock',
    'nav.auctions': 'Auctions',
    'nav.branches': 'Branches',
    'nav.freightCalculator': 'Freight Calculator',
    'nav.shippingSchedule': 'Shipping Schedule',
    'nav.faq': 'FAQ',
    'nav.testimonials': 'Testimonials',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',

    // Actions & Buttons
    'action.getQuote': 'Get Free Quote',
    'action.quoteRequested': 'Quote Requested',
    'action.addToWishlist': 'Add to Wishlist',
    'action.inWishlist': 'In Wishlist',
    'action.viewDetails': 'View Details',
    'action.reserveHold': '48h Reserve Hold',
    'action.contactAgent': 'Contact Vehicle Agent',
    'action.calculateFreight': 'Calculate C&F Quote',
    'action.retry': 'Retry',
    'action.filter': 'Filter',
    'action.reset': 'Reset',
    'action.apply': 'Apply',
    'action.close': 'Close',

    // Filters & Search
    'filter.make': 'Make',
    'filter.model': 'Model',
    'filter.year': 'Year',
    'filter.price': 'Price',
    'filter.bodyType': 'Body Type',
    'filter.fuelType': 'Fuel Type',
    'filter.transmission': 'Transmission',
    'filter.steering': 'Steering',
    'filter.mileage': 'Mileage',
    'filter.location': 'Port / Location',

    // Customer Portal Shell
    'customer.dashboard': 'Dashboard',
    'customer.inventory': 'Search Stock',
    'customer.inquiries': 'Inquiries & Quotes',
    'customer.wishlist': 'My Wishlist',
    'customer.favourites': 'Favourites',
    'customer.myVehicles': 'My Vehicles',
    'customer.shipments': 'Shipment Tracking',
    'customer.invoices': 'Invoices & Ledger',
    'customer.payments': 'Wire Remittances',
    'customer.documents': 'Export Documents',
    'customer.notifications': 'Bulletins & Alerts',
    'customer.profile': 'Profile & Security',
    'customer.statement': 'My Statement',
    'customer.wireRemittance': 'Wire Remittance',
    'customer.logout': 'Sign Out',
    'customer.tier': 'Tier Account',
    'customer.sync': 'Sync Status',
    'customer.overview': 'Overview',

    // Compliance & Localization
    'compliance.bannerTitle': 'Country Import Compliance Localization',
    'compliance.filterActive': 'Regulatory Compliance Filter Active',
    'compliance.toggleShowAll': 'Show All Vehicles',
    'compliance.toggleCompliantOnly': 'Show Compliant Vehicles Only',
    'compliance.cardTitle': 'Destination Import Compliance Evaluation',
    'compliance.passed': 'Import Eligible (Compliant)',
    'compliance.failed': 'Restricted / Non-Compliant',
    'compliance.regulations': 'Import Regulations',
    'compliance.requiredInspections': 'Required Pre-Export Inspections',

    // Common & Footer
    'footer.copyright': '© 2026 CarChief Japan Co., Ltd. All rights reserved.',
    'footer.tagline': 'Premium Japanese used vehicles exported globally with guaranteed quality.',
    'footer.quickLinks': 'Quick Links',
    'footer.customerSupport': 'Customer Support',
    'footer.legal': 'Legal & Compliance',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
  },

  ja: {
    // Top Bar & Utility
    'header.japanTime': '日本時間: JST (UTC+9)',
    'header.carsInStock': '総在庫台数: 68,000台以上',
    'header.countrySelect': '仕向地 / 港を選択',
    'header.currencySelect': '通貨を選択',
    'header.languageSelect': '言語を選択',
    'header.skipLink': 'メインコンテンツへスキップ',
    'header.searchPlaceholder': 'メーカー、車種名、管理番号、キーワードで検索...',
    'header.searchButton': '検索',
    'header.allCategories': '全メーカー',
    'header.login': 'ログイン',
    'header.register': '新規登録',
    'header.online': 'オンライン',

    // Navigation
    'nav.home': 'ホーム',
    'nav.inventory': '在庫車両一覧',
    'nav.services': 'サービス案内',
    'nav.howToBuy': 'ご購入の流れ',
    'nav.clearance': '特選クリアランス',
    'nav.auctions': 'オークション代行',
    'nav.branches': '海外拠点',
    'nav.freightCalculator': '海上運賃計算機',
    'nav.shippingSchedule': '船便スケジュール',
    'nav.faq': 'よくある質問',
    'nav.testimonials': 'お客様の声',
    'nav.about': '会社概要',
    'nav.contact': 'お問い合わせ',

    // Actions & Buttons
    'action.getQuote': '無料見積りを依頼',
    'action.quoteRequested': '見積り依頼済み',
    'action.addToWishlist': 'お気に入りに追加',
    'action.inWishlist': 'お気に入り登録中',
    'action.viewDetails': '車両詳細を見る',
    'action.reserveHold': '48時間キープ予約',
    'action.contactAgent': '担当スタッフに相談',
    'action.calculateFreight': 'C&F見積りを計算',
    'action.retry': '再試行',
    'action.filter': '絞り込み',
    'action.reset': 'リセット',
    'action.apply': '適用',
    'action.close': '閉じる',

    // Filters & Search
    'filter.make': 'メーカー',
    'filter.model': '車種名',
    'filter.year': '年式',
    'filter.price': '価格',
    'filter.bodyType': 'ボディタイプ',
    'filter.fuelType': '燃料種別',
    'filter.transmission': 'ミッション',
    'filter.steering': 'ハンドル位置',
    'filter.mileage': '走行距離',
    'filter.location': '保管港 / 所在地',

    // Customer Portal Shell
    'customer.dashboard': 'マイダッシュボード',
    'customer.inventory': '車両在庫検索',
    'customer.inquiries': 'お問い合わせ・見積り',
    'customer.wishlist': 'お気に入りリスト',
    'customer.favourites': 'お気に入り',
    'customer.myVehicles': 'ご成約車両一覧',
    'customer.shipments': '船便・輸送追跡',
    'customer.invoices': '請求書・取引明細',
    'customer.payments': '送金・支払通知',
    'customer.documents': '輸出関連書類',
    'customer.notifications': '重要なお知らせ',
    'customer.profile': '会員情報・設定',
    'customer.statement': '取引明細書',
    'customer.wireRemittance': '送金・支払通知',
    'customer.logout': 'ログアウト',
    'customer.tier': '会員ランク',
    'customer.sync': 'データ同期',
    'customer.overview': '概要',

    // Compliance & Localization
    'compliance.bannerTitle': '仕向国輸入規制ローカライゼーション',
    'compliance.filterActive': '輸入規制フィルター適用中',
    'compliance.toggleShowAll': '全車両を表示',
    'compliance.toggleCompliantOnly': '適合車両のみ表示',
    'compliance.cardTitle': '仕向国輸入規制適合チェック',
    'compliance.passed': '輸入適合（輸入可能）',
    'compliance.failed': '規制対象（輸入制限あり）',
    'compliance.regulations': '輸入規制基準',
    'compliance.requiredInspections': '必須事前輸出検査',

    // Common & Footer
    'footer.copyright': '© 2026 株式会社CarChief Japan. 無断転載を禁じます。',
    'footer.tagline': '高品質な日本車を世界へ。安心と信頼のグローバル輸出プラットフォーム。',
    'footer.quickLinks': 'クイックリンク',
    'footer.customerSupport': 'カスタマーサポート',
    'footer.legal': '法務・コンプライアンス',
    'footer.privacy': 'プライバシーポリシー',
    'footer.terms': '利用規約',
  },

  es: {
    // Top Bar & Utility
    'header.japanTime': 'Hora de Japón: JST (UTC+9)',
    'header.carsInStock': 'Autos en Stock: 68,000+',
    'header.countrySelect': 'Seleccionar País / Puerto de Destino',
    'header.currencySelect': 'Seleccionar Moneda',
    'header.languageSelect': 'Seleccionar Idioma',
    'header.skipLink': 'Saltar al contenido principal',
    'header.searchPlaceholder': 'Buscar por marca, modelo, código o palabra clave...',
    'header.searchButton': 'Buscar',
    'header.allCategories': 'Todas las Marcas',
    'header.login': 'Iniciar Sesión',
    'header.register': 'Registrarse',
    'header.online': 'EN LÍNEA',

    // Navigation
    'nav.home': 'Inicio',
    'nav.inventory': 'Inventario Total',
    'nav.services': 'Servicios',
    'nav.howToBuy': 'Cómo Comprar',
    'nav.clearance': 'Ofertas de Liquidación',
    'nav.auctions': 'Subastas',
    'nav.branches': 'Sucursales',
    'nav.freightCalculator': 'Calculadora de Flete',
    'nav.shippingSchedule': 'Itinerario Marítimo',
    'nav.faq': 'Preguntas Frecuentes',
    'nav.testimonials': 'Testimonios',
    'nav.about': 'Nosotros',
    'nav.contact': 'Contacto',

    // Actions & Buttons
    'action.getQuote': 'Cotización Gratis',
    'action.quoteRequested': 'Cotización Solicitada',
    'action.addToWishlist': 'Guardar en Favoritos',
    'action.inWishlist': 'En Favoritos',
    'action.viewDetails': 'Ver Detalles',
    'action.reserveHold': 'Reserva de 48 Horas',
    'action.contactAgent': 'Contactar Agente',
    'action.calculateFreight': 'Calcular Cotización C&F',
    'action.retry': 'Reintentar',
    'action.filter': 'Filtrar',
    'action.reset': 'Restablecer',
    'action.apply': 'Aplicar',
    'action.close': 'Cerrar',

    // Filters & Search
    'filter.make': 'Marca',
    'filter.model': 'Modelo',
    'filter.year': 'Año',
    'filter.price': 'Precio',
    'filter.bodyType': 'Tipo de Carrocería',
    'filter.fuelType': 'Combustible',
    'filter.transmission': 'Transmisión',
    'filter.steering': 'Dirección',
    'filter.mileage': 'Kilometraje',
    'filter.location': 'Ubicación / Puerto',

    // Customer Portal Shell
    'customer.dashboard': 'Panel Principal',
    'customer.inventory': 'Buscar Stock',
    'customer.inquiries': 'Consultas y Cotizaciones',
    'customer.wishlist': 'Mis Favoritos',
    'customer.favourites': 'Favoritos',
    'customer.myVehicles': 'Mis Vehículos',
    'customer.shipments': 'Rastreo de Envíos',
    'customer.invoices': 'Facturas y Pagos',
    'customer.payments': 'Transferencias',
    'customer.documents': 'Documentos de Exportación',
    'customer.notifications': 'Alertas y Noticias',
    'customer.profile': 'Perfil y Seguridad',
    'customer.statement': 'Mi Estado de Cuenta',
    'customer.wireRemittance': 'Transferencia Bancaria',
    'customer.logout': 'Cerrar Sesión',
    'customer.tier': 'Nivel de Cuenta',
    'customer.sync': 'Sincronizar',
    'customer.overview': 'Resumen',

    // Compliance & Localization
    'compliance.bannerTitle': 'Localización de Normativa de Importación',
    'compliance.filterActive': 'Filtro de Cumplimiento Regulatorio Activo',
    'compliance.toggleShowAll': 'Mostrar Todos los Vehículos',
    'compliance.toggleCompliantOnly': 'Mostrar Solo Vehículos Elegibles',
    'compliance.cardTitle': 'Evaluación de Normativa de Importación',
    'compliance.passed': 'Apto para Importación (Cumple Requisitos)',
    'compliance.failed': 'Restringido / No Cumple Requisitos',
    'compliance.regulations': 'Regulaciones de Importación',
    'compliance.requiredInspections': 'Inspecciones Previas Requeridas',

    // Common & Footer
    'footer.copyright': '© 2026 CarChief Japan Co., Ltd. Todos los derechos reservados.',
    'footer.tagline': 'Exportación global de vehículos japoneses seleccionados con garantía de calidad.',
    'footer.quickLinks': 'Enlaces Rápidos',
    'footer.customerSupport': 'Atención al Cliente',
    'footer.legal': 'Legal y Cumplimiento',
    'footer.privacy': 'Política de Privacidad',
    'footer.terms': 'Términos de Servicio',
  },

  fr: {
    // Top Bar & Utility
    'header.japanTime': 'Heure du Japon: JST (UTC+9)',
    'header.carsInStock': 'Véhicules en Stock: 68 000+',
    'header.countrySelect': 'Sélectionner le pays / port de destination',
    'header.currencySelect': 'Sélectionner la devise',
    'header.languageSelect': 'Sélectionner la langue',
    'header.skipLink': 'Passer au contenu principal',
    'header.searchPlaceholder': 'Recherche par marque, modèle, référence...',
    'header.searchButton': 'Rechercher',
    'header.allCategories': 'Toutes les Marques',
    'header.login': 'Connexion',
    'header.register': 'Inscription',
    'header.online': 'EN LIGNE',

    // Navigation
    'nav.home': 'Accueil',
    'nav.inventory': 'Tous les Véhicules',
    'nav.services': 'Services',
    'nav.howToBuy': 'Guide d’Achat',
    'nav.clearance': 'Déstockage',
    'nav.auctions': 'Enchères',
    'nav.branches': 'Agences',
    'nav.freightCalculator': 'Calculateur de Fret',
    'nav.shippingSchedule': 'Calendrier Maritime',
    'nav.faq': 'FAQ',
    'nav.testimonials': 'Témoignages',
    'nav.about': 'À Propos',
    'nav.contact': 'Contact',

    // Actions & Buttons
    'action.getQuote': 'Devis Gratuit',
    'action.quoteRequested': 'Devis Demandé',
    'action.addToWishlist': 'Ajouter aux Favoris',
    'action.inWishlist': 'Dans les Favoris',
    'action.viewDetails': 'Voir Détails',
    'action.reserveHold': 'Réservation 48h',
    'action.contactAgent': 'Contacter un Conseiller',
    'action.calculateFreight': 'Calculer Devis C&F',
    'action.retry': 'Réessayer',
    'action.filter': 'Filtrer',
    'action.reset': 'Réinitialiser',
    'action.apply': 'Appliquer',
    'action.close': 'Fermer',

    // Filters & Search
    'filter.make': 'Marque',
    'filter.model': 'Modèle',
    'filter.year': 'Année',
    'filter.price': 'Prix',
    'filter.bodyType': 'Carrosserie',
    'filter.fuelType': 'Carburant',
    'filter.transmission': 'Transmission',
    'filter.steering': 'Direction',
    'filter.mileage': 'Kilométrage',
    'filter.location': 'Port / Emplacement',

    // Customer Portal Shell
    'customer.dashboard': 'Tableau de Bord',
    'customer.inventory': 'Rechercher Véhicules',
    'customer.inquiries': 'Demandes et Devis',
    'customer.wishlist': 'Mes Favoris',
    'customer.favourites': 'Favoris',
    'customer.myVehicles': 'Mes Véhicules',
    'customer.shipments': 'Suivi des Expéditions',
    'customer.invoices': 'Factures et Relevés',
    'customer.payments': 'Virements Bancaires',
    'customer.documents': 'Documents d’Exportation',
    'customer.notifications': 'Alertes et Bulletins',
    'customer.profile': 'Profil et Sécurité',
    'customer.statement': 'Mon Relevé de Compte',
    'customer.wireRemittance': 'Virement Bancaire',
    'customer.logout': 'Déconnexion',
    'customer.tier': 'Niveau de Compte',
    'customer.sync': 'Synchroniser',
    'customer.overview': 'Aperçu',

    // Compliance & Localization
    'compliance.bannerTitle': 'Conformité Réglementaire à l’Importation',
    'compliance.filterActive': 'Filtre de Conformité Actif',
    'compliance.toggleShowAll': 'Afficher Tous les Véhicules',
    'compliance.toggleCompliantOnly': 'Véhicules Conformes Uniquement',
    'compliance.cardTitle': 'Évaluation de Conformité Destination',
    'compliance.passed': 'Éligible à l’Importation (Conforme)',
    'compliance.failed': 'Non Conforme / Soumis à Restriction',
    'compliance.regulations': 'Règles d’Importation',
    'compliance.requiredInspections': 'Inspections Préalables Requises',

    // Common & Footer
    'footer.copyright': '© 2026 CarChief Japan Co., Ltd. Tous droits réservés.',
    'footer.tagline': 'Exportation mondiale de véhicules d’occasion japonais avec qualité certifiée.',
    'footer.quickLinks': 'Liens Rapides',
    'footer.customerSupport': 'Support Client',
    'footer.legal': 'Mentions Légales',
    'footer.privacy': 'Politique de Confidentialité',
    'footer.terms': 'Conditions d’Utilisation',
  },

  sw: {
    // Top Bar & Utility
    'header.japanTime': 'Saa za Japani: JST (UTC+9)',
    'header.carsInStock': 'Magari Yaliyopo: 68,000+',
    'header.countrySelect': 'Chagua Nchi / Bandari ya Kufikisha',
    'header.currencySelect': 'Chagua Sarafu',
    'header.languageSelect': 'Chagua Lugha',
    'header.skipLink': 'Ruka hadi yaliyomo makuu',
    'header.searchPlaceholder': 'Tafuta kwa kutumia aina ya gari, modeli au namba...',
    'header.searchButton': 'Tafuta',
    'header.allCategories': 'Aina Zote',
    'header.login': 'Ingia',
    'header.register': 'Jisajili',
    'header.online': 'HEWANI',

    // Navigation
    'nav.home': 'Nyumbani',
    'nav.inventory': 'Magari Yote',
    'nav.services': 'Huduma Zetu',
    'nav.howToBuy': 'Jinsi ya Kununua',
    'nav.clearance': 'Punguzo Maalum',
    'nav.auctions': 'Minada ya Japani',
    'nav.branches': 'Matawi Yetu',
    'nav.freightCalculator': 'Kikokotoo cha Usafirishaji',
    'nav.shippingSchedule': 'Ratiba ya Meli',
    'nav.faq': 'Maswali ya Mara kwa Mara',
    'nav.testimonials': 'Ushuhuda wa Wateja',
    'nav.about': 'Kutuhusu',
    'nav.contact': 'Wasiliana Nasi',

    // Actions & Buttons
    'action.getQuote': 'Pata Makadirio ya Bei Bure',
    'action.quoteRequested': 'Ombi Limetumwa',
    'action.addToWishlist': 'Weka Kwenye Orodha ya Matamanio',
    'action.inWishlist': 'Imo Kwenye Orodha',
    'action.viewDetails': 'Tazama Maelezo ya Gari',
    'action.reserveHold': 'Hifadhi kwa Saa 48',
    'action.contactAgent': 'Wasiliana na Mwakilishi',
    'action.calculateFreight': 'Hesabu Bei ya C&F',
    'action.retry': 'Jaribu Tena',
    'action.filter': 'Chuja',
    'action.reset': 'Weka Upya',
    'action.apply': 'Tumia',
    'action.close': 'Funga',

    // Filters & Search
    'filter.make': 'Aina ya Gari (Make)',
    'filter.model': 'Modeli',
    'filter.year': 'Mwaka',
    'filter.price': 'Bei',
    'filter.bodyType': 'Umbo la Gari',
    'filter.fuelType': 'Mafuta',
    'filter.transmission': 'Gia',
    'filter.steering': 'Uendeshaji (Steering)',
    'filter.mileage': 'Kilomita Zilizotembelewa',
    'filter.location': 'Bandari / Mahali',

    // Customer Portal Shell
    'customer.dashboard': 'Dashibodi',
    'customer.inventory': 'Tafuta Magari',
    'customer.inquiries': 'Maulizo na Nukuu za Bei',
    'customer.wishlist': 'Magari Niliyohifadhi',
    'customer.favourites': 'Vipendwa',
    'customer.myVehicles': 'Magari Yangu',
    'customer.shipments': 'Ufuatiliaji wa Meli',
    'customer.invoices': 'Ankara na Malipo',
    'customer.payments': 'Thibitisho za Benki',
    'customer.documents': 'Nyaraka za Usafirishaji',
    'customer.notifications': 'Taarifa na Arifa',
    'customer.profile': 'Wasifu na Usalama',
    'customer.statement': 'Taarifa Yangu ya Akaunti',
    'customer.wireRemittance': 'Uhamisho wa Fedha',
    'customer.logout': 'Ondoka',
    'customer.tier': 'Kiwango cha Akaunti',
    'customer.sync': 'Sawazisha Data',
    'customer.overview': 'Muhtasari',

    // Compliance & Localization
    'compliance.bannerTitle': 'Uzingatiaji wa Sheria za Uagizaji Nchini',
    'compliance.filterActive': 'Kichujio cha Sheria za Uagizaji Kimewashwa',
    'compliance.toggleShowAll': 'Onyesha Magari Yote',
    'compliance.toggleCompliantOnly': 'Onyesha Magari Yanayokidhi Vigezo Tu',
    'compliance.cardTitle': 'Tathmini ya Sheria za Uingizaji Nchini',
    'compliance.passed': 'Inaruhusiwa Kuingizwa (Inakidhi Vigezo)',
    'compliance.failed': 'Imepigwa Marufuku / Haikidhi Vigezo',
    'compliance.regulations': 'Vigezo vya Uingizaji Nchini',
    'compliance.requiredInspections': 'Ukaguzi wa Lazima Kabla ya Usafirishaji',

    // Common & Footer
    'footer.copyright': '© 2026 CarChief Japan Co., Ltd. Haki zote zimehifadhiwa.',
    'footer.tagline': 'Usafirishaji wa magari bora ya Kijapani ulimwenguni kote kwa uhakika na ubora.',
    'footer.quickLinks': 'Viungo vya Haraka',
    'footer.customerSupport': 'Msaada kwa Wateja',
    'footer.legal': 'Sheria na Taratibu',
    'footer.privacy': 'Sera ya Faragha',
    'footer.terms': 'Masharti ya Huduma',
  },

  pt: {
    // Top Bar & Utility
    'header.japanTime': 'Hora do Japão: JST (UTC+9)',
    'header.carsInStock': 'Veículos em Stock: 68.000+',
    'header.countrySelect': 'Selecionar País / Porto de Destino',
    'header.currencySelect': 'Selecionar Moeda',
    'header.languageSelect': 'Selecionar Idioma',
    'header.skipLink': 'Saltar para o conteúdo principal',
    'header.searchPlaceholder': 'Pesquisar por marca, modelo, referência...',
    'header.searchButton': 'Pesquisar',
    'header.allCategories': 'Todas as Marcas',
    'header.login': 'Entrar',
    'header.register': 'Registar',
    'header.online': 'ONLINE',

    // Navigation
    'nav.home': 'Início',
    'nav.inventory': 'Todos os Veículos',
    'nav.services': 'Serviços',
    'nav.howToBuy': 'Como Comprar',
    'nav.clearance': 'Promoções',
    'nav.auctions': 'Leilões',
    'nav.branches': 'Filiais',
    'nav.freightCalculator': 'Calculadora de Frete',
    'nav.shippingSchedule': 'Calendário de Envios',
    'nav.faq': 'Perguntas Frequentes',
    'nav.testimonials': 'Testemunhos',
    'nav.about': 'Sobre Nós',
    'nav.contact': 'Contacto',

    // Actions & Buttons
    'action.getQuote': 'Pedir Cotação Grátis',
    'action.quoteRequested': 'Cotação Solicitada',
    'action.addToWishlist': 'Adicionar aos Favoritos',
    'action.inWishlist': 'Nos Favoritos',
    'action.viewDetails': 'Ver Detalhes',
    'action.reserveHold': 'Reserva de 48h',
    'action.contactAgent': 'Falar com Agente',
    'action.calculateFreight': 'Calcular Cotação C&F',
    'action.retry': 'Tentar Novamente',
    'action.filter': 'Filtrar',
    'action.reset': 'Redefinir',
    'action.apply': 'Aplicar',
    'action.close': 'Fechar',

    // Filters & Search
    'filter.make': 'Marca',
    'filter.model': 'Modelo',
    'filter.year': 'Ano',
    'filter.price': 'Preço',
    'filter.bodyType': 'Tipo de Carroçaria',
    'filter.fuelType': 'Combustível',
    'filter.transmission': 'Transmissão',
    'filter.steering': 'Direção',
    'filter.mileage': 'Quilometragem',
    'filter.location': 'Porto / Localização',

    // Customer Portal Shell
    'customer.dashboard': 'Painel Principal',
    'customer.inventory': 'Procurar Stock',
    'customer.inquiries': 'Consultas e Cotações',
    'customer.wishlist': 'Lista de Favoritos',
    'customer.favourites': 'Favoritos',
    'customer.myVehicles': 'Meus Veículos',
    'customer.shipments': 'Rastreio de Envios',
    'customer.invoices': 'Faturas e Extratos',
    'customer.payments': 'Transferências',
    'customer.documents': 'Documentos de Exportação',
    'customer.notifications': 'Alertas e Avisos',
    'customer.profile': 'Perfil e Segurança',
    'customer.statement': 'Meu Extrato',
    'customer.wireRemittance': 'Transferência Bancária',
    'customer.logout': 'Terminar Sessão',
    'customer.tier': 'Nível de Conta',
    'customer.sync': 'Sincronizar',
    'customer.overview': 'Visão Geral',

    // Compliance & Localization
    'compliance.bannerTitle': 'Localização de Regulamentos de Importação',
    'compliance.filterActive': 'Filtro de Conformidade Ativo',
    'compliance.toggleShowAll': 'Mostrar Todos os Veículos',
    'compliance.toggleCompliantOnly': 'Mostrar Apenas Veículos Elegíveis',
    'compliance.cardTitle': 'Avaliação de Regulamentos de Importação',
    'compliance.passed': 'Elegível para Importação (Conforme)',
    'compliance.failed': 'Restrito / Não Conforme',
    'compliance.regulations': 'Regulamentos de Importação',
    'compliance.requiredInspections': 'Inspeções Prévias Obrigatórias',

    // Common & Footer
    'footer.copyright': '© 2026 CarChief Japan Co., Ltd. Todos os direitos reservados.',
    'footer.tagline': 'Exportação global de viaturas japonesas usadas com garantia de qualidade.',
    'footer.quickLinks': 'Links Rápidos',
    'footer.customerSupport': 'Apoio ao Cliente',
    'footer.legal': 'Legal e Conformidade',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos de Serviço',
  },

  ru: {
    // Top Bar & Utility
    'header.japanTime': 'Время в Японии: JST (UTC+9)',
    'header.carsInStock': 'Всего авто в наличии: 68,000+',
    'header.countrySelect': 'Выберите страну / порт назначения',
    'header.currencySelect': 'Выберите валюту',
    'header.languageSelect': 'Выберите язык',
    'header.skipLink': 'Перейти к основному контенту',
    'header.searchPlaceholder': 'Поиск по марке, модели, номеру кузова или ключевым словам...',
    'header.searchButton': 'Найти',
    'header.allCategories': 'Все марки',
    'header.login': 'Вход',
    'header.register': 'Регистрация',
    'header.online': 'ОНЛАЙН',

    // Navigation
    'nav.home': 'Главная',
    'nav.inventory': 'Все автомобили',
    'nav.services': 'Услуги',
    'nav.howToBuy': 'Как купить',
    'nav.clearance': 'Распродажа',
    'nav.auctions': 'Аукционы Японии',
    'nav.branches': 'Филиалы',
    'nav.freightCalculator': 'Калькулятор доставки',
    'nav.shippingSchedule': 'Расписание судов',
    'nav.faq': 'Вопросы и ответы',
    'nav.testimonials': 'Отзывы клиентов',
    'nav.about': 'О компании',
    'nav.contact': 'Контакты',

    // Actions & Buttons
    'action.getQuote': 'Получить расчет бесплатно',
    'action.quoteRequested': 'Запрос отправлен',
    'action.addToWishlist': 'В избранное',
    'action.inWishlist': 'В избранном',
    'action.viewDetails': 'Подробнее',
    'action.reserveHold': 'Бронь на 48 часов',
    'action.contactAgent': 'Связаться с менеджером',
    'action.calculateFreight': 'Рассчитать C&F стоимость',
    'action.retry': 'Повторить',
    'action.filter': 'Фильтр',
    'action.reset': 'Сбросить',
    'action.apply': 'Применить',
    'action.close': 'Закрыть',

    // Filters & Search
    'filter.make': 'Марка',
    'filter.model': 'Модель',
    'filter.year': 'Год выпуска',
    'filter.price': 'Цена',
    'filter.bodyType': 'Тип кузова',
    'filter.fuelType': 'Топливо',
    'filter.transmission': 'Коробка передач',
    'filter.steering': 'Руль',
    'filter.mileage': 'Пробег',
    'filter.location': 'Порт / Расположение',

    // Customer Portal Shell
    'customer.dashboard': 'Личный кабинет',
    'customer.inventory': 'Каталог автомобилей',
    'customer.inquiries': 'Запросы и расчеты',
    'customer.wishlist': 'Избранные автомобили',
    'customer.favourites': 'Избранное',
    'customer.myVehicles': 'Мои автомобили',
    'customer.shipments': 'Отслеживание доставки',
    'customer.invoices': 'Счета и платежи',
    'customer.payments': 'Банковские переводы',
    'customer.documents': 'Экспортные документы',
    'customer.notifications': 'Уведомления и новости',
    'customer.profile': 'Профиль и безопасность',
    'customer.statement': 'Моя выписка',
    'customer.wireRemittance': 'Банковский перевод',
    'customer.logout': 'Выйти',
    'customer.tier': 'Уровень аккаунта',
    'customer.sync': 'Синхронизация',
    'customer.overview': 'Обзор',

    // Compliance & Localization
    'compliance.bannerTitle': 'Соответствие правилам импорта страны',
    'compliance.filterActive': 'Фильтр соответствия правилам импорта включен',
    'compliance.toggleShowAll': 'Показать все автомобили',
    'compliance.toggleCompliantOnly': 'Только подходящие автомобили',
    'compliance.cardTitle': 'Проверка соответствия правилам импорта',
    'compliance.passed': 'Разрешено к импорту (Соответствует)',
    'compliance.failed': 'Ограничено / Не соответствует',
    'compliance.regulations': 'Требования к импорту',
    'compliance.requiredInspections': 'Обязательные инспекции перед отправкой',

    // Common & Footer
    'footer.copyright': '© 2026 CarChief Japan Co., Ltd. Все права защищены.',
    'footer.tagline': 'Экспорт проверенных японских автомобилей по всему миру с гарантией качества.',
    'footer.quickLinks': 'Быстрые ссылки',
    'footer.customerSupport': 'Служба поддержки',
    'footer.legal': 'Юридическая информация',
    'footer.privacy': 'Политика конфиденциальности',
    'footer.terms': 'Условия обслуживания',
  },

  ar: {
    // Top Bar & Utility
    'header.japanTime': 'توقيت اليابان: JST (UTC+9)',
    'header.carsInStock': 'إجمالي السيارات المتوفرة: 68,000+',
    'header.countrySelect': 'اختر الدولة / ميناء الوصول',
    'header.currencySelect': 'اختر العملة',
    'header.languageSelect': 'اختر اللغة',
    'header.skipLink': 'الانتقال إلى المحتوى الرئيسي',
    'header.searchPlaceholder': 'ابحث حسب الشركة، الموديل، رقم الهيكل أو الكلمات الرئيسية...',
    'header.searchButton': 'بحث',
    'header.allCategories': 'جميع الشركات',
    'header.login': 'تسجيل الدخول',
    'header.register': 'إنشاء حساب',
    'header.online': 'متصل',

    // Navigation
    'nav.home': 'الرئيسية',
    'nav.inventory': 'جميع السيارات',
    'nav.services': 'الخدمات',
    'nav.howToBuy': 'كيفية الشراء',
    'nav.clearance': 'عروض التصفية',
    'nav.auctions': 'المزادات اليابانية',
    'nav.branches': 'فروعنا',
    'nav.freightCalculator': 'حاسبة الشحن البحري',
    'nav.shippingSchedule': 'جدول رحلات الشحن',
    'nav.faq': 'الأسئلة الشائعة',
    'nav.testimonials': 'آراء العملاء',
    'nav.about': 'من نحن',
    'nav.contact': 'اتصل بنا',

    // Actions & Buttons
    'action.getQuote': 'طلب عرض أسعار مجاني',
    'action.quoteRequested': 'تم طلب عرض السعر',
    'action.addToWishlist': 'إضافة إلى المفضلة',
    'action.inWishlist': 'في المفضلة',
    'action.viewDetails': 'عرض التفاصيل',
    'action.reserveHold': 'حجز لمدة 48 ساعة',
    'action.contactAgent': 'تواصل مع مستشارك',
    'action.calculateFreight': 'حساب سعر C&F',
    'action.retry': 'إعادة المحاولة',
    'action.filter': 'تصفية',
    'action.reset': 'إعادة ضبط',
    'action.apply': 'تطبيق',
    'action.close': 'إغلاق',

    // Filters & Search
    'filter.make': 'الشركة المصنعة',
    'filter.model': 'الموديل',
    'filter.year': 'سنة الصنع',
    'filter.price': 'السعر',
    'filter.bodyType': 'نوع الهيكل',
    'filter.fuelType': 'نوع الوقود',
    'filter.transmission': 'ناقل الحركة',
    'filter.steering': 'جهة المقود',
    'filter.mileage': 'المسافة المقطوعة',
    'filter.location': 'الميناء / الموقع',

    // Customer Portal Shell
    'customer.dashboard': 'لوحة التحكم',
    'customer.inventory': 'البحث في المخزون',
    'customer.inquiries': 'الاستفسارات وعروض الأسعار',
    'customer.wishlist': 'قائمة المفضلة',
    'customer.favourites': 'المفضلة',
    'customer.myVehicles': 'سياراتي المحجوزة',
    'customer.shipments': 'تتبع الشحنات',
    'customer.invoices': 'الفواتير والمدفوعات',
    'customer.payments': 'الحوالات البنكية',
    'customer.documents': 'مستندات التصدير',
    'customer.notifications': 'الإشعارات والتنبيهات',
    'customer.profile': 'الملف الشخصي والأمان',
    'customer.statement': 'كشف الحساب',
    'customer.wireRemittance': 'حوالة مصرفية',
    'customer.logout': 'تسجيل الخروج',
    'customer.tier': 'فئة الحساب',
    'customer.sync': 'تحديث البيانات',
    'customer.overview': 'نظرة عامة',

    // Compliance & Localization
    'compliance.bannerTitle': 'التحقق من لوائح وشروط الاستيراد المحلية',
    'compliance.filterActive': 'فلترة السيارات المطابقة للمواصفات مفعلة',
    'compliance.toggleShowAll': 'عرض جميع السيارات',
    'compliance.toggleCompliantOnly': 'عرض السيارات المطابقة فقط',
    'compliance.cardTitle': 'تقييم مطابقة السيارة لشروط الاستيراد',
    'compliance.passed': 'مؤهلة للاستيراد (مطابقة للمواصفات)',
    'compliance.failed': 'مقيدة / غير مطابقة للمواصفات',
    'compliance.regulations': 'شروط ولوائح الاستيراد',
    'compliance.requiredInspections': 'الفحوصات الإلزامية قبل التصدير',

    // Common & Footer
    'footer.copyright': '© 2026 شركة CarChief اليابان المحدودة. جميع الحقوق محفوظة.',
    'footer.tagline': 'تصدير سيارات يابانية مستعملة عالية الجودة لجميع أنحاء العالم مع ضمان الفحص.',
    'footer.quickLinks': 'روابط سريعة',
    'footer.customerSupport': 'خدمة العملاء',
    'footer.legal': 'الشؤون القانونية والامتثال',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الخدمة',
  },
};

/** Customer-app UI translations added independently from the public-web catalog. */
export const CUSTOMER_APP_TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    'customer.profileSecurity': 'Profile & Security', 'customer.bulletinsAlerts': 'Bulletins & Alerts', 'customer.portalInventory': 'CUSTOMER PORTAL / INVENTORY',
    'customer.vehicleInventory': 'Vehicle Inventory', 'customer.inventorySubtitle': 'Search and compare vehicles available to your account, then enquire or reserve the vehicle that fits your requirements.',
    'customer.tierAccount': '{tier} Tier Account', 'customer.tierInfo': 'More information about {tier} tier pricing',
    'customer.discount': 'Discount: {percent}%', 'customer.reservations': 'Reservations: {used}/{maximum} used · {remaining} remaining',
    'customer.previous': 'Previous', 'customer.next': 'Next', 'customer.pageOf': 'Page {page} of {total}',
    'customer.vehiclesCount': '{count} vehicles', 'customer.totalPurchased': 'Total Purchased', 'customer.commercialBills': 'Commercial Bills',
    'customer.settlementRate': 'Settlement Rate', 'customer.availableFunds': 'Available Funds', 'customer.fleetLogistics': 'Fleet Logistics',
    'customer.readyToShip': 'Ready to ship', 'customer.inTransit': 'In transit', 'customer.arrivedAtPort': 'Arrived at port', 'customer.delivered': 'Delivered', 'customer.grid': 'Grid', 'customer.list': 'List', 'customer.gridView': 'Grid view', 'customer.listView': 'List view',
    'customer.searchStock': 'Search Stock', 'customer.resetFilters': 'Reset Filters', 'customer.loading': 'Loading...', 'customer.retry': 'Retry',
  },
  ja: {
    'customer.profileSecurity': 'プロフィールとセキュリティ', 'customer.bulletinsAlerts': 'お知らせとアラート', 'customer.portalInventory': 'カスタマーポータル / 在庫',
    'customer.vehicleInventory': '車両在庫', 'customer.inventorySubtitle': 'お客様のアカウントで利用できる車両を検索・比較し、ご希望の車両についてお問い合わせまたは予約ができます。',
    'customer.tierAccount': '{tier}会員アカウント', 'customer.tierInfo': '{tier}会員価格の詳細',
    'customer.discount': '割引: {percent}%', 'customer.reservations': '予約: {used}/{maximum}台使用中 · 残り{remaining}台',
    'customer.previous': '前へ', 'customer.next': '次へ', 'customer.pageOf': '{page} / {total}ページ',
    'customer.vehiclesCount': '{count}台', 'customer.totalPurchased': '購入車両数', 'customer.commercialBills': 'コマーシャルインボイス',
    'customer.settlementRate': '決済率', 'customer.availableFunds': '利用可能残高', 'customer.fleetLogistics': '車両物流状況',
    'customer.readyToShip': '出荷準備完了', 'customer.inTransit': '輸送中', 'customer.arrivedAtPort': '港に到着', 'customer.delivered': '納車済み', 'customer.grid': 'グリッド', 'customer.list': 'リスト', 'customer.gridView': 'グリッド表示', 'customer.listView': 'リスト表示',
    'customer.searchStock': '在庫を検索', 'customer.resetFilters': 'フィルターをリセット', 'customer.loading': '読み込み中...', 'customer.retry': '再試行',
  },
  es: {
    'customer.profileSecurity': 'Perfil y seguridad', 'customer.bulletinsAlerts': 'Boletines y alertas', 'customer.vehicleInventory': 'Inventario de vehículos',
    'customer.inventorySubtitle': 'Busca y compara vehículos disponibles para tu cuenta y consulta o reserva el que necesitas.', 'customer.tierAccount': 'Cuenta de nivel {tier}', 'customer.tierInfo': 'Más información sobre los precios del nivel {tier}',
    'customer.discount': 'Descuento: {percent}%', 'customer.reservations': 'Reservas: {used}/{maximum} usadas · {remaining} restantes', 'customer.previous': 'Anterior', 'customer.next': 'Siguiente', 'customer.pageOf': 'Página {page} de {total}', 'customer.vehiclesCount': '{count} vehículos',
    'customer.totalPurchased': 'Total comprado', 'customer.commercialBills': 'Facturas comerciales', 'customer.settlementRate': 'Tasa de liquidación', 'customer.availableFunds': 'Fondos disponibles', 'customer.fleetLogistics': 'Logística de vehículos', 'customer.readyToShip': 'Listo para enviar', 'customer.inTransit': 'En tránsito', 'customer.arrivedAtPort': 'Llegó al puerto', 'customer.delivered': 'Entregado', 'customer.searchStock': 'Buscar stock', 'customer.resetFilters': 'Restablecer filtros', 'customer.loading': 'Cargando...', 'customer.retry': 'Reintentar',
  },
  fr: {
    'customer.profileSecurity': 'Profil et sécurité', 'customer.bulletinsAlerts': 'Bulletins et alertes', 'customer.vehicleInventory': 'Inventaire des véhicules', 'customer.inventorySubtitle': 'Recherchez et comparez les véhicules disponibles pour votre compte, puis demandez ou réservez celui qui vous convient.', 'customer.tierAccount': 'Compte niveau {tier}', 'customer.tierInfo': 'Informations sur les prix du niveau {tier}', 'customer.discount': 'Remise : {percent} %', 'customer.reservations': 'Réservations : {used}/{maximum} utilisées · {remaining} restantes', 'customer.previous': 'Précédent', 'customer.next': 'Suivant', 'customer.pageOf': 'Page {page} sur {total}', 'customer.vehiclesCount': '{count} véhicules', 'customer.totalPurchased': 'Total acheté', 'customer.commercialBills': 'Factures commerciales', 'customer.settlementRate': 'Taux de règlement', 'customer.availableFunds': 'Fonds disponibles', 'customer.fleetLogistics': 'Logistique des véhicules', 'customer.readyToShip': 'Prêt à expédier', 'customer.inTransit': 'En transit', 'customer.arrivedAtPort': 'Arrivé au port', 'customer.delivered': 'Livré', 'customer.searchStock': 'Rechercher un stock', 'customer.resetFilters': 'Réinitialiser les filtres', 'customer.loading': 'Chargement...', 'customer.retry': 'Réessayer',
  },
  sw: {
    'customer.profileSecurity': 'Wasifu na Usalama', 'customer.bulletinsAlerts': 'Taarifa na Tahadhari', 'customer.vehicleInventory': 'Orodha ya Magari', 'customer.inventorySubtitle': 'Tafuta na linganisha magari yanayopatikana kwenye akaunti yako, kisha uliza au weka nafasi.', 'customer.tierAccount': 'Akaunti ya kiwango cha {tier}', 'customer.tierInfo': 'Maelezo zaidi kuhusu bei ya kiwango cha {tier}', 'customer.discount': 'Punguzo: {percent}%', 'customer.reservations': 'Nafasi: {used}/{maximum} zimetumika · {remaining} zimesalia', 'customer.previous': 'Iliyotangulia', 'customer.next': 'Inayofuata', 'customer.pageOf': 'Ukurasa wa {page} kati ya {total}', 'customer.vehiclesCount': 'magari {count}', 'customer.totalPurchased': 'Jumla Iliyonunuliwa', 'customer.commercialBills': 'Ankara za Biashara', 'customer.settlementRate': 'Kiwango cha Malipo', 'customer.availableFunds': 'Fedha Zinazopatikana', 'customer.fleetLogistics': 'Usafirishaji wa Magari', 'customer.readyToShip': 'Tayari kusafirishwa', 'customer.inTransit': 'Zinasafirishwa', 'customer.arrivedAtPort': 'Zimefika bandarini', 'customer.delivered': 'Zimewasilishwa', 'customer.searchStock': 'Tafuta Magari', 'customer.resetFilters': 'Weka upya vichujio', 'customer.loading': 'Inapakia...', 'customer.retry': 'Jaribu tena',
  },
  pt: {
    'customer.profileSecurity': 'Perfil e segurança', 'customer.bulletinsAlerts': 'Boletins e alertas', 'customer.vehicleInventory': 'Inventário de veículos', 'customer.inventorySubtitle': 'Pesquise e compare veículos disponíveis para a sua conta e consulte ou reserve o veículo ideal.', 'customer.tierAccount': 'Conta de nível {tier}', 'customer.tierInfo': 'Mais informações sobre os preços do nível {tier}', 'customer.discount': 'Desconto: {percent}%', 'customer.reservations': 'Reservas: {used}/{maximum} usadas · {remaining} restantes', 'customer.previous': 'Anterior', 'customer.next': 'Seguinte', 'customer.pageOf': 'Página {page} de {total}', 'customer.vehiclesCount': '{count} veículos', 'customer.totalPurchased': 'Total comprado', 'customer.commercialBills': 'Faturas comerciais', 'customer.settlementRate': 'Taxa de liquidação', 'customer.availableFunds': 'Fundos disponíveis', 'customer.fleetLogistics': 'Logística de veículos', 'customer.readyToShip': 'Pronto para envio', 'customer.inTransit': 'Em trânsito', 'customer.arrivedAtPort': 'Chegou ao porto', 'customer.delivered': 'Entregue', 'customer.searchStock': 'Pesquisar stock', 'customer.resetFilters': 'Repor filtros', 'customer.loading': 'A carregar...', 'customer.retry': 'Tentar novamente',
  },
  ru: {
    'customer.profileSecurity': 'Профиль и безопасность', 'customer.bulletinsAlerts': 'Уведомления и оповещения', 'customer.vehicleInventory': 'Автомобильный инвентарь', 'customer.inventorySubtitle': 'Ищите и сравнивайте автомобили, доступные для вашего аккаунта, затем отправляйте запрос или бронируйте подходящий.', 'customer.tierAccount': 'Аккаунт уровня {tier}', 'customer.tierInfo': 'Подробнее о ценах уровня {tier}', 'customer.discount': 'Скидка: {percent}%', 'customer.reservations': 'Брони: {used}/{maximum} использовано · осталось {remaining}', 'customer.previous': 'Назад', 'customer.next': 'Далее', 'customer.pageOf': 'Страница {page} из {total}', 'customer.vehiclesCount': '{count} автомобилей', 'customer.totalPurchased': 'Всего куплено', 'customer.commercialBills': 'Коммерческие счета', 'customer.settlementRate': 'Процент расчётов', 'customer.availableFunds': 'Доступные средства', 'customer.fleetLogistics': 'Логистика автомобилей', 'customer.readyToShip': 'Готов к отправке', 'customer.inTransit': 'В пути', 'customer.arrivedAtPort': 'Прибыл в порт', 'customer.delivered': 'Доставлен', 'customer.searchStock': 'Поиск автомобилей', 'customer.resetFilters': 'Сбросить фильтры', 'customer.loading': 'Загрузка...', 'customer.retry': 'Повторить',
  },
  ar: {
    'customer.profileSecurity': 'الملف الشخصي والأمان', 'customer.bulletinsAlerts': 'النشرات والتنبيهات', 'customer.vehicleInventory': 'مخزون المركبات', 'customer.inventorySubtitle': 'ابحث وقارن المركبات المتاحة لحسابك، ثم أرسل استفساراً أو احجز المركبة المناسبة.', 'customer.tierAccount': 'حساب الفئة {tier}', 'customer.tierInfo': 'معلومات أكثر عن أسعار الفئة {tier}', 'customer.discount': 'الخصم: {percent}%', 'customer.reservations': 'الحجوزات: {used}/{maximum} مستخدمة · المتبقي {remaining}', 'customer.previous': 'السابق', 'customer.next': 'التالي', 'customer.pageOf': 'الصفحة {page} من {total}', 'customer.vehiclesCount': '{count} مركبات', 'customer.totalPurchased': 'إجمالي المشتريات', 'customer.commercialBills': 'الفواتير التجارية', 'customer.settlementRate': 'نسبة التسوية', 'customer.availableFunds': 'الأموال المتاحة', 'customer.fleetLogistics': 'لوجستيات المركبات', 'customer.readyToShip': 'جاهز للشحن', 'customer.inTransit': 'قيد النقل', 'customer.arrivedAtPort': 'وصل إلى الميناء', 'customer.delivered': 'تم التسليم', 'customer.searchStock': 'بحث في المخزون', 'customer.resetFilters': 'إعادة ضبط المرشحات', 'customer.loading': 'جارٍ التحميل...', 'customer.retry': 'إعادة المحاولة',
  },
};

/**
 * Replaces `{key}` placeholders in a template string with provided values.
 */
export function formatTranslation(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

/**
 * Translates a key for a given language with fallback to English and optional default text.
 */
export function translateKey(
  lang: LanguageCode,
  key: string,
  params?: Record<string, string | number>,
  defaultText?: string
): string {
  const dict = TRANSLATION_DICTIONARIES[lang] || TRANSLATION_DICTIONARIES.en;
  const englishDict = TRANSLATION_DICTIONARIES.en;

  const raw = CUSTOMER_APP_TRANSLATIONS[lang]?.[key] ?? CUSTOMER_APP_TRANSLATIONS.en[key] ?? dict[key] ?? englishDict[key] ?? defaultText ?? key;
  return formatTranslation(raw, params);
}

/**
 * Resolves language code safely, defaulting to 'en' if invalid.
 */
export function resolveLanguageCode(code: unknown): LanguageCode {
  if (typeof code === 'string' && SUPPORTED_LANGUAGES.some((lang) => lang.code === code)) {
    return code as LanguageCode;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Gets language metadata for a given code.
 */
export function getLanguageInfo(code: LanguageCode): LanguageInfo {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ??
    SUPPORTED_LANGUAGES[0]!
  );
}
