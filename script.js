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

// Camera stream
let stream = null;
let currentFilters = {
    subject: null,
    exam: null,
    tag: null
};

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
                <button class="edit-note" data-id="${note.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-note" data-id="${note.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-note').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.getAttribute('data-id'));
            editNote(noteId);
        });
    });
    
    document.querySelectorAll('.delete-note').forEach(button => {
        button.addEventListener('click', function() {
            const noteId = parseInt(this.getAttribute('data-id'));
            deleteNote(noteId);
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
        saveManualNoteBtn.addEventListener('click', updateHandler);
    }
}

// Delete note
function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(n => n.id !== id);
        displayNotes();
        updateStats();
        showNotification('Note deleted successfully!', 'warning');
    }
}

// Search functionality
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
});

function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayNotes();
        return;
    }
    
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm) ||
        note.subject.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm)
    );
    
    displayNotes(filteredNotes);
}

// Update stats
function updateStats() {
    const totalNotes = notes.length;
    const subjects = [...new Set(notes.map(note => note.subject))].length;
    
    document.querySelectorAll('.stats-number')[0].textContent = totalNotes;
    document.querySelectorAll('.stats-number')[1].textContent = subjects;
    
    // Update progress bars (simulated)
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const currentWidth = parseInt(bar.style.width);
        const newWidth = Math.min(currentWidth + 5, 100);
        bar.style.width = `${newWidth}%`;
    });
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Filter by subject tag
document.querySelectorAll('.subject-tag').forEach(tag => {
    tag.addEventListener('click', function() {
        const tagText = this.textContent;
        let filteredNotes = [];
        
        if (['Mathematics', 'Science', 'History', 'Geography', 'Current Affairs'].includes(tagText)) {
            // Filter by subject
            filteredNotes = notes.filter(note => note.subject === tagText);
            currentFilters.subject = tagText;
        } else if (['UPSC', 'SSC', 'Banking', 'Railway'].includes(tagText)) {
            // Filter by exam (simulated - in real app you'd have exam field)
            filteredNotes = notes; // For demo, show all notes
            currentFilters.exam = tagText;
        } else {
            // Filter by tag (simulated)
            filteredNotes = notes.filter(note => 
                note.content.toLowerCase().includes(tagText.toLowerCase()) ||
                note.title.toLowerCase().includes(tagText.toLowerCase())
            );
            currentFilters.tag = tagText;
        }
        
        displayNotes(filteredNotes);
        showNotification(`Filtered by: ${tagText}`, 'info');
    });
});

// Store the original save handler
const originalSaveHandler = saveManualNoteBtn.onclick;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    displayNotes();
    updateStats();
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});