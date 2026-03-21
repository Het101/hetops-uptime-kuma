const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.vue');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if teleport is inside form
    if (content.includes('<form') && content.includes('<teleport')) {
        // Move teleport outside form if it's currently inside
        // Or just replace:
        // <form ...>
        //     <teleport to="body">
        // with
        // <teleport to="body">
        //     <form ...>
        
        content = content.replace(/(<form[^>]*>\s*)<teleport to="body">/g, '<teleport to="body">\n$1');
        content = content.replace(/<\/teleport>(\s*<\/form>)/g, '$1\n    </teleport>');
        
        fs.writeFileSync(file, content);
    }
}
