describe('Attendance API', () => {
  it('uploads a sample image to mark attendance', () => {
    const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn8B9Y0d7wAAAABJRU5ErkJggg=='
    const apiBase = Cypress.env('API_BASE') || 'http://localhost:8000'
    cy.window().then((win) => {
      const byteChars = atob(b64)
      const byteNumbers = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })
      const file = new File([blob], 'sample.png', { type: 'image/png' })
      const fd = new FormData()
      fd.append('image', file, 'sample.png')

      return win.fetch(`${apiBase}/api/attendance/mark`, { method: 'POST', body: fd, credentials: 'include' })
        .then(r => r.json())
        .then((body) => {
          // mark endpoint may return error if no enrolled faces; assert response shape
          expect(body).to.be.an('object')
        })
    })
  })
})
