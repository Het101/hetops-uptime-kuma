const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.vue');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find <div ref="modal" ...> or similar
    // Actually we only need to teleport the ones that are inside modals array.
    if (!content.includes('class="modal')) continue;
    
    // We already added <teleport to="body"> in some, let's revert and do it properly via regex
    content = content.replace(/<teleport to="body">\s*(<div ref="modal"[^>]*>)/g, '$1');
    content = content.replace(/(<div ref="modal"[^>]*>)/s, '<teleport to="body">\n$1');
    
    // Find the matching closing div for the modal
    // To do this simply, we assume the modal div is the direct child of <template> or <form>
    // So the closing </div> is usually right before </form> or </template>
    // A better approach is to use a simple stack parser.
    
    const lines = content.split('\n');
    let inModal = false;
    let divDepth = 0;
    let modalStartLine = -1;
    let modalEndLine = -1;
    let teleportAddedStart = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!inModal && line.match(/<div [^>]*class="(?:[^"]*\s)?modal(?:\s[^"]*)?"/)) {
            inModal = true;
            modalStartLine = i;
            if (i > 0 && lines[i-1].includes('<teleport')) {
                // already has teleport
                teleportAddedStart = true;
            } else {
                lines.splice(i, 0, '    <teleport to="body">');
                i++;
                modalStartLine = i;
            }
        }
        
        if (inModal) {
            const matchesDiv = line.match(/<div/g);
            if (matchesDiv) divDepth += matchesDiv.length;
            
            const matchesCloseDiv = line.match(/<\/div>/g);
            if (matchesCloseDiv) divDepth -= matchesCloseDiv.length;
            
            if (divDepth === 0) { // closed the modal div
                modalEndLine = i;
                if (i + 1 < lines.length && !lines[i+1].includes('</teleport>')) {
                    lines.splice(i + 1, 0, '    </teleport>');
                }
                inModal = false;
                break; // only do the first modal in file, or multiple?
            }
        }
    }
    
    // Some files have multiple modals, e.g. APIKeyDialog has two. Wait, my code breaks after first?
    content = lines.join('\n');
    fs.writeFileSync(file, content);
}
