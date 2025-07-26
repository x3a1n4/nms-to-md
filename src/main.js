import {parseNamespaceFile} from '../out/parser/parser.js';
import * as templates from './templates.js';

document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('nms-file');
    const metaForm = document.getElementById('meta-form');
    const hasDeps = document.getElementById('has-deps');
    const depsList = document.getElementById('deps-list');
    const convertBtn = document.getElementById('convert-btn');
    const downloadBtn = document.getElementById('download-btn');
    const githubCheck = document.getElementById('github-check');
    const githubUrl = document.getElementById('github-url');
    const websiteCheck = document.getElementById('website-check');
    const websiteUrl = document.getElementById('website-url');
    const filePreview = document.getElementById('file-preview');

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length && files[0].name.endsWith('.nms')) {
            fileInput.files = files;
            showForm();
            showPreview(files[0]);
        }
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length && fileInput.files[0].name.endsWith('.nms')) {
            showForm();
            showPreview(fileInput.files[0]);
        }
    });

    function showForm() {
        uploadArea.classList.add('hidden');
        metaForm.classList.remove('hidden');
    }

    function showPreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            filePreview.innerHTML = `
                <div id="file-preview-header">${file.name}</div>
                <pre>${e.target.result.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
            `;
            filePreview.classList.remove('hidden');
        };
        reader.readAsText(file);
    }

    // Dependencies
    hasDeps.addEventListener('change', () => {
        depsList.classList.toggle('hidden', !hasDeps.checked);
    });

    depsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-dep-list')) {
            const row = document.createElement('div');
            row.className = 'dep-row';
            row.innerHTML = `<input type="text" name="dependency[]" placeholder="Dependency">
                             <button type="button" class="remove-dep">-</button>`;
            depsList.insertBefore(row, e.target);
        }
        if (e.target.classList.contains('remove-dep')) {
            const row = e.target.parentElement;
            if (depsList.querySelectorAll('.dep-row').length > 1) {
                depsList.removeChild(row);
            } else {
                row.querySelector('input').value = '';
                // Uncheck "Has dependencies" if last row is removed
                hasDeps.checked = false;
                depsList.classList.add('hidden');
            }
        }
    });

    // Github/Website checkboxes
    githubCheck.addEventListener('change', () => {
        githubUrl.classList.toggle('hidden', !githubCheck.checked);
    });
    websiteCheck.addEventListener('change', () => {
        websiteUrl.classList.toggle('hidden', !websiteCheck.checked);
    });

    // Convert button
    convertBtn.addEventListener('click', () => {
        let valid = true;
        // Required fields
        const requiredFields = [
            metaForm.querySelector('input[name="name"]'),
            metaForm.querySelector('input[name="author"]'),
            metaForm.querySelector('input[name="description"]')
        ];
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('required-highlight');
                valid = false;
            } else {
                field.classList.remove('required-highlight');
            }
        });

        // If has dependencies, check each dependency input
        if (hasDeps.checked) {
            const depInputs = depsList.querySelectorAll('input[name="dependency[]"]');
            depInputs.forEach(input => {
                if (!input.value.trim()) {
                    input.classList.add('required-highlight');
                    valid = false;
                } else {
                    input.classList.remove('required-highlight');
                }
            });
        }

        // If Github checked, check github-url
        if (githubCheck.checked && !githubUrl.value.trim()) {
            githubUrl.classList.add('required-highlight');
            valid = false;
        } else {
            githubUrl.classList.remove('required-highlight');
        }
        // If Website checked, check website-url
        if (websiteCheck.checked && !websiteUrl.value.trim()) {
            websiteUrl.classList.add('required-highlight');
            valid = false;
        } else {
            websiteUrl.classList.remove('required-highlight');
        }

        if (!valid) return;
        
        convert_to_md();
    });

    // Remove highlight when user types
    metaForm.addEventListener('input', (e) => {
        if (e.target.classList.contains('required-highlight') && e.target.value.trim()) {
            e.target.classList.remove('required-highlight');
        }
    });

    function convert_to_md() {
        console.log("converting file!");
        // Load the file data
        const fileData = filePreview.querySelector('pre').textContent;

        // output: a folder with the name of the project containing the following
        // if only one namespace: 
        //      a file in the top-level folder called index.md
        //      a file in the top-level folder for each class called [classname].md
        // if multiple namespaces:
        //      a file in the top-level folder called index.md
        //      a subfolder for each namespace
        //      a file in each namespace subfolder called index.md
        //      a file in each namespace subfolder for each class in the namespace called [classname].md

        // parse file
        let namespaceStorage = new Map();
        let classStorage = new Map();

        // get taglist, in format tag = {tag: "tagname", text: "text"}
        let taglist = [];
        if (document.getElementsByName("mapping")[0].checked) {taglist.push({tag: "mapping", text: ""});}
        if (document.getElementsByName("scripting")[0].checked) {taglist.push({tag: "scripting", text: ""});}
        if (document.getElementsByName("msc")[0].checked) {taglist.push({tag: "msc", text: ""});}
        if (document.getElementsByName("non-msc")[0].checked) {taglist.push({tag: "non_msc", text: ""});}
        if (document.getElementById("github-check").checked) {taglist.push({tag: "github", text: document.getElementById("github-url").value});}
        if (document.getElementById("website-check").checked) {taglist.push({tag: "website", text: document.getElementById("website-url").value});}

        // get dependencies
        let dependencies = [];
        if (document.getElementById("has-deps").checked) {
            dependencies = [...document.querySelectorAll('input[name="dependency[]"]')].map(dep => dep.value);
            // console.log(dependencies);
        }

        // parse namespace
        parseNamespaceFile(fileData, namespaceStorage, classStorage);
        // parse to format
        let out = templates.parse(namespaceStorage, classStorage);
        console.log(out);
        
        // error if no namespaces
        if (namespaceStorage.size == 0){
            alert("No namespaces found!");
            return;
        }
        
        // create file structure
        var zip = new JSZip();
        // if only one namespace
        if (namespaceStorage.size === 1) {
            zip.file("index.md", templates.namespaceIndexTemplate(
                metaForm.querySelector('input[name="name"]').value, 
                metaForm.querySelector('input[name="author"]').value, 
                metaForm.querySelector('input[name="description"]').value, 
                dependencies, 
                taglist, 
                out));
            /*
            console.log(templates.namespaceIndexTemplate(
                metaForm.querySelector('input[name="name"]').value, 
                metaForm.querySelector('input[name="author"]').value, 
                metaForm.querySelector('input[name="description"]').value, 
                dependencies, 
                taglist, 
                out
            ))
            */
            
            // add classes
            for (const [className, classObject] of classStorage){
                zip.file(`${className}.md`, templates.classTemplate(className, classObject));
                //console.log(templates.classTemplate(className, classObject));
            }

            
        }else{
            zip.file("index.md", templates.utilityIndexTemplate(
                metaForm.querySelector('input[name="name"]').value, 
                metaForm.querySelector('input[name="author"]').value, 
                metaForm.querySelector('input[name="description"]').value, 
                dependencies, 
                taglist, 
                out));
            /*
            console.log(templates.utilityIndexTemplate(
                metaForm.querySelector('input[name="name"]').value, 
                metaForm.querySelector('input[name="author"]').value, 
                metaForm.querySelector('input[name="description"]').value, 
                dependencies, 
                taglist, 
                out
            ))
            */
            
            for (const [name, namespace] of Object.entries(out)){
                //console.log(name, namespace);
                zip.folder(name).file("index.md", templates.namespaceTemplate(name, namespace));
                //console.log(templates.namespaceTemplate(name, namespace));

                // add classes
                for (const [className, classObject] of Object.entries(namespace["classes"])){
                    zip.folder(name).file(`${className}.md`, templates.classTemplate(className, classObject));
                    //console.log(templates.classTemplate(className, classObject));
                }
            }
        }

        zip.generateAsync({type:"blob"})
            .then(function(content) {
                // see FileSaver.js
                saveAs(content, `${metaForm.querySelector('input[name="name"]').value}.zip`);
            });
    }
});

