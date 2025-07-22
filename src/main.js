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
        // You will define convert_to_md()
        if (typeof convert_to_md === 'function') {
            convert_to_md().then(blob => {
                // Show download button
                downloadBtn.classList.remove('hidden');
                downloadBtn.onclick = () => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'converted.md';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                };
            });
        }
    });
});