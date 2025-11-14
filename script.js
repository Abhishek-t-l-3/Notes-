// Sample notes data
let notes = [
    {
        id: 1,
        title: "Algebra Formulas",
        subject: "Mathematics",
        content: "Quadratic Formula: x = [-b ± √(b² - 4ac)] / 2a\n\nArithmetic Progression: a, a+d, a+2d, ...\nSum = n/2 [2a + (n-1)d]",
        date: "2023-10-15"
    },
    {
        id: 2,
        title: "Indian Constitution",
        subject: "History",
        content: "The Constitution of India was adopted on 26 November 1949 and came into effect on 26 January 1950.\n\nIt is the longest written constitution of any sovereign country in the world.",
        date: "2023-10-10"
    },
    {
        id: 3,
        title: "Newton's Laws of Motion",
        subject: "Science",
        content: "First Law: An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.\n\nSecond Law: F = ma\n\nThird Law: For every action, there is an equal and opposite reaction.",
        date: "2023-10-05"
    }
];

// DOM Elements
const notesList = document.getElementById('notesList');
const startCameraBtn = document.getElementById('startCamera');
const captureImageBtn = document.getElementById('captureImage');
const retakeImageBtn = document.getElementById('retakeImage');
const extractTextBtn = document.getElementById('extractText');
const saveNoteBtn = document.getElementById('saveNote');
const cameraPreview = document.getElementById('cameraPreview');
const captureCanvas = document.getElementById('captureCanvas');
const capturedImage = document.getElementById('capturedImage');
const extractionSpinner = document.getElementById('extractionSpinner');
const extractedText = document.getElementById('extractedText');
const noteTitle = document.getElementById('noteTitle');
const noteSubject = document.getElementById('noteSubject');
const saveManualNoteBtn = document.getElementById('saveManualNote');
const searchInput = document.querySelector('.search-box');
const searchButton = document.querySelector('.btn-primary');
const exportAllPdfBtn = document.getElementById('exportAllPdf');
const generatePdfBtn = document.getElementById('generatePdf');

// Camera stream
let stream = null;
let currentFilters = {
    subject: null,
    exam: null,
    tag: null
};

// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Display notes
function displayNotes(filteredNotes = null) {
    const notesToDisplay = filteredNotes || notes;
    notesList.innerHTML = '';
    
    if (notesToDisplay.length === 0) {
        notesList.innerHTML = '<p class="text-center text-muted">No notes found. Capture an image or add a manual note to get started!</p>';
        return;
    }
    
    notesToDisplay.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-card';
        noteElement.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="text-muted small mb-2">${note.subject} • ${note.date}</div>
            <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
            <div class="note-actions">
                <button class="edit-note" data-id="${note.id}" title="Edit Note">
                    <i class="fas fa-edit me-1"></i> Edit
                </button>
                <button class="export-pdf-btn export-single-pdf" data-id="${note.id}" title="Export as PDF">
                    <i class="fas fa-file-pdf me-1"></i> PDF
                </button>
                <button class="delete-note" data-id="${note.id}" title="Delete Note">
                    <i class="fas fa-trash me-1"></i> Delete
                </button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
    
    // Add event listeners for buttons
    addNoteEventListeners();
}

// Add event listeners to note buttons
function addNoteEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-note').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.getAttribute('data-id'));
            editNote(noteId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-note').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.getAttribute('data-id'));
            deleteNote(noteId);
        });
    });
    
    // Single PDF export buttons
    document.querySelectorAll('.export-single-pdf').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.getAttribute('data-id'));
            exportSingleNoteAsPdf(noteId);
        });
    });
}

// Start camera
startCameraBtn.addEventListener('click', async function() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        cameraPreview.srcObject = stream;
        captureImageBtn.disabled = false;
        startCameraBtn.disabled = true;
        cameraPreview.style.display = 'block';
    } catch (err) {
        alert('Error accessing camera: ' + err.message);
        console.error('Camera error:', err);
    }
});

// Capture image
captureImageBtn.addEventListener('click', function() {
    const context = captureCanvas.getContext('2d');
    captureCanvas.width = cameraPreview.videoWidth;
    captureCanvas.height = cameraPreview.videoHeight;
    context.drawImage(cameraPreview, 0, 0, captureCanvas.width, captureCanvas.height);
    
    // Convert canvas to image and display
    capturedImage.src = captureCanvas.toDataURL('image/png');
    capturedImage.style.display = 'block';
    cameraPreview.style.display = 'none';
    captureImageBtn.style.display = 'none';
    retakeImageBtn.style.display = 'inline-block';
    extractTextBtn.disabled = false;
    
    // Stop camera stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

// Retake image
retakeImageBtn.addEventListener('click', function() {
    capturedImage.style.display = 'none';
    cameraPreview.style.display = 'block';
    captureImageBtn.style.display = 'inline-block';
    retakeImageBtn.style.display = 'none';
    extractTextBtn.disabled = true;
    extractedText.style.display = 'none';
    saveNoteBtn.disabled = true;
    
    // Restart camera
    startCameraBtn.click();
});

// Extract text from image
extractTextBtn.addEventListener('click', async function() {
    extractionSpinner.style.display = 'block';
    extractTextBtn.disabled = true;
    
    try {
        // Using Tesseract.js for OCR
        const result = await Tesseract.recognize(
            capturedImage.src,
            'eng',
            { 
                logger: m => {
                    console.log(m);
                    if (m.status === 'recognizing text') {
                        extractionSpinner.querySelector('p').textContent = `Extracting text... ${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        );
        
        extractedText.textContent = result.data.text || 'No text could be extracted. Please try again with a clearer image.';
        extractedText.style.display = 'block';
        saveNoteBtn.disabled = false;
    } catch (error) {
        console.error('OCR Error:', error);
        extractedText.textContent = 'Error extracting text. Please try again with a clearer image.';
        extractedText.style.display = 'block';
    } finally {
        extractionSpinner.style.display = 'none';
        extractTextBtn.disabled = false;
    }
});

// Save note from extracted text
saveNoteBtn.addEventListener('click', function() {
    if (!noteTitle.value.trim()) {
        alert('Please enter a title for your note');
        return;
    }
    
    if (noteSubject.value === 'Select Subject') {
        alert('Please select a subject');
        return;
    }
    
    const newNote = {
        id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
        title: noteTitle.value,
        subject: noteSubject.value,
        content: extractedText.textContent,
        date: new Date().toISOString().split('T')[0]
    };
    
    notes.push(newNote);
    displayNotes();
    updateStats();
    
    // Reset form
    noteTitle.value = '';
    noteSubject.value = 'Select Subject';
    extractedText.style.display = 'none';
    saveNoteBtn.disabled = true;
    capturedImage.style.display = 'none';
    cameraPreview.style.display = 'block';
    captureImageBtn.style.display = 'inline-block';
    retakeImageBtn.style.display = 'none';
    extractTextBtn.disabled = true;
    
    // Show success message
    showNotification('Note saved successfully!', 'success');
    
    // Scroll to notes section
    document.getElementById('notes-section').scrollIntoView({ behavior: 'smooth' });
});

// Save manual note
saveManualNoteBtn.addEventListener('click', function() {
    const title = document.getElementById('manualNoteTitle').value;
    const subject = document.getElementById('manualNoteSubject').value;
    const content = document.getElementById('manualNoteContent').value;
    
    if (!title || !subject || !content) {
        alert('Please fill in all fields');
        return;
    }
    
    const newNote = {
        id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
        title: title,
        subject: subject,
        content: content,
        date: new Date().toISOString().split('T')[0]
    };
    
    notes.push(newNote);
    displayNotes();
    updateStats();
    
    // Close modal and reset form
    document.getElementById('addNoteForm').reset();
    bootstrap.Modal.getInstance(document.getElementById('addNoteModal')).hide();
    
    // Show success message
    showNotification('Note saved successfully!', 'success');
});

// Edit note
function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        document.getElementById('manualNoteTitle').value = note.title;
        document.getElementById('manualNoteSubject').value = note.subject;
        document.getElementById('manualNoteContent').value = note.content;
        
        // Remove the note from the array
        notes = notes.filter(n => n.id !== id);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addNoteModal'));
        modal.show();
        
        // Update save button text
        saveManualNoteBtn.textContent = 'Update Note';
        
        // Change the save button event listener temporarily
        const updateHandler = function() {
            const title = document.getElementById('manualNoteTitle').value;
            const subject = document.getElementById('manualNoteSubject').value;
            const content = document.getElementById('manualNoteContent').value;
            
            if (!title || !subject || !content) {
                alert('Please fill in all fields');
                return;
            }
            
            const updatedNote = {
                id: id,
                title: title,
                subject: subject,
                content: content,
                date: new Date().toISOString().split('T')[0]
            };
            
            notes.push(updatedNote);
            displayNotes();
            updateStats();
            
            // Close modal and reset form
            document.getElementById('addNoteForm').reset();
            modal.hide();
            
            // Reset save button
            saveManualNoteBtn.textContent = 'Save Note';
            saveManualNoteBtn.removeEventListener('click', updateHandler);
            saveManualNoteBtn.addEventListener('click', originalSaveHandler);
            
            // Show success message
            showNotification('Note updated successfully!', 'success');
        };
        
        saveManualNoteBtn.removeEventListener('click', originalSaveHandler);
