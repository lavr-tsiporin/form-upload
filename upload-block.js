const DELAY_BLOCK = 10000
let result = []

const createUpload = (root) => {
  const span = document.createElement('span')
  const input = document.createElement('input')
  const button = document.createElement('button')
  root.before(span)
  span.append(input, button)
  span.setAttribute('style', `margin: 15px 0; display: flex; align-items: center; justify-content: end;`)
  input.setAttribute('type', 'file')
  input.setAttribute('accept', '.csv')
  input.setAttribute('id', 'upload-block-file')
  input.addEventListener('change', handlerUploadFile)
  button.classList.add('btn', 'btn-primary')
  button.textContent = 'Start'
  button.addEventListener('click', () => handlerStartBlock(result))
}

function handlerUploadFile() {
  if (this.files.length > 1) {
    window.alert('Требуется один файл')
    return
  }
  const file = this.files[0]
  const reader = new FileReader()
  reader.readAsText(file)
  reader.addEventListener('load', () => {
    const fileResponse = reader.result
    result = formatFileInArray(fileResponse)
    console.log(result)
  })
  reader.addEventListener('error', () => window.alert('Ошибка при загрузке файла'))
}

const formatFileInArray = (str) => {
  return str
    .split('@')
    .filter(el => el !== '')
    .map(el => el.split(';'))
    .map(el => ({
      license: el[0]
        .replace('\r', '')
        .replace('\n', '')
        .trim(),
      resolution: el[1]
        .replace(/^\"/g, '')
        .replace(/\"$/g, '')
        .replace(/\"\"/g, '"')
        .trim()
    }))
}

async function handlerStartBlock(data) {
  if (data.length < 1) {
    return
  }

  for (let i = 0; i < data.length; i++) {
    try {
      await new Promise((resolve) => {
        setTimeout(() => {
          document.querySelector('select.form-control').value = '2'
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          document.querySelector('input[name="key"]').value = data[i].license
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          document.querySelector('textarea[name="description"]').value = data[i].resolution
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve) => {
        setTimeout(() => {
          document.querySelector('button[type="submit"]').click()
          resolve(true)
        }, 1000)
      })
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          const select = document.querySelector('select.form-control')
          if (select.value === '') {
            console.log(`${data[i].license} blocks with ${data[i].resolution}`)
            resolve(true)
          }
          reject(data[i].license)
        }, DELAY_BLOCK)
      })
    } catch (e) {
      console.error(e)
    }
  }
}

const root = document.querySelector('#addBlocking')
createUpload(root)