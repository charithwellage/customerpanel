"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderFooterConfig = renderFooterConfig;
function renderFooterConfig(props = {}) {
    const siteName = props.siteName || 'CarChief';
    const year = props.year || new Date().getFullYear();
    const contactPhone = props.contactPhone || '+256 700 000 000';
    return {
        landmark: 'footer',
        copyright: `© ${year} ${siteName}. All rights reserved.`,
        contactPhone,
    };
}
//# sourceMappingURL=Footer.js.map