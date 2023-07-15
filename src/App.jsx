import React, { useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import * as PDFJS from "pdfjs-dist";
import Tesseract from 'tesseract.js';
import { procesarElementosParalelo, procesarAnalisisParalelo, resumirAnalisis, analisisImagen } from './funciones.js';

// Inicializar la biblioteca PDF.js
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`;

const App = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [texto, setTexto] = useState([]);
  const [paginas, setPaginas] = useState([]);
  const [analisis, setAnalisis] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoImagen, setCargandoImagen] = useState(null);
  const [informacion, setInformacion] = useState("");
  const [resumen, setResumen] = useState("");
  const [imagen, setImagen] = useState("");
  const [seleccionArchivo, setSeleccionArchivo] = useState('');
  const [seleccionExamen, setSeleccionExamen] = useState('');

  const eliminarDatosSensibles = (textoArray) => {
    let palabras = ["nombre", "paciente", "rut"];
    let reemplazo = "";

    return textoArray.map(obj => {
      let texto = obj.text.replace(/\s+/g, ' ');
      palabras.forEach(palabra => {
        let regex = new RegExp(`(?<=${palabra}[:]?)(\\s+\\S+){1,4}`, "gi");
        texto = texto.replace(regex, reemplazo);
      });

      return {
        ...obj,
        text: texto
      };
    });
  };
  
  const handlePdfUpload = (event) => {
    const file = event.target.files[0];
    setPdfFile(file);
    // Cargar el archivo PDF
    PDFJS.getDocument(URL.createObjectURL(file)).promise.then((pdf) => {
      const maxPages = Math.min(pdf.numPages, 20); // máximo de 20 páginas
      const pagePromises = [];
      // Obtener el contenido de texto de cada página del PDF
      for (let i = 1; i <= maxPages; i++) {
        pagePromises.push(
          pdf.getPage(i).then((page) => {
            return page.getTextContent();
          })
        );
      }
      // Crear un array de objetos con el texto y el número de página para cada página
      Promise.all(pagePromises).then((pages) => {
        const pageData = [];
        for (let i = 0; i < pages.length; i++) {
          let text = "";
          for (let j = 0; j < pages[i].items.length; j++) {
            text += pages[i].items[j].str + " ";
          }
          pageData.push({ text: text, pageNum: i + 1 });
        }
        // Actualizar el estado con el array de datos de página sin datos sensibles
        setTexto(eliminarDatosSensibles(pageData));
      });
    });
  };

  const handleImageUpload = async (e) => {
    if (e.target.files) {
      if (e.target.files.length > 20) {
        alert('Por favor, selecciona no más de 20 imágenes a la vez.');
        return;
      }
      setCargandoImagen("Extrayendo texto de las imagenes 🔍🖼️➡️📝📄");
      const promises = Array.from(e.target.files).map((file, index) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = async () => {
            const result = await Tesseract.recognize(
              reader.result,
              'eng'
            );
            setTexto(prevState => [...prevState, { text: result.data.text, pageNum: index + 1 }]);
            resolve();
          };
          reader.onerror = reject;
        });
      });

      Promise.all(promises)
        .then(() => {
          setCargandoImagen(null);
          // Actualizar el estado con el array de datos de página sin datos sensibles
          setTexto(prevState => eliminarDatosSensibles(prevState));
        })
        .catch(() => setCargandoImagen('Ha ocurrido un error al procesar las imágenes.'));
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setTexto([]);
    setPaginas([]);
    setAnalisis([]);
    setResumen("");
    setImagen("");
    setSeleccionArchivo("")
    setSeleccionExamen("");
  };

  const extraerYAnalizarExamenes = async () => {
    setCargando(true);
    setInformacion("Leyendo exámenes y extrayendo resultados 📖🔍");
    try {
      // Primero extraemos el texto
      const resultadosExtraccion = await procesarElementosParalelo(texto.map(objeto => objeto.text));
      setPaginas(resultadosExtraccion);
      setInformacion("Interpretando exámenes 🧠📑");

      // Luego analizamos el texto extraído
      const resultadosAnalisis = await procesarAnalisisParalelo(resultadosExtraccion);
      setAnalisis(resultadosAnalisis);
      setInformacion("Resumiendo interpretación 📋😎");

      // Luego resumimos todo
      const resultadosResumen = await resumirAnalisis(resultadosAnalisis.join(" "));
      setResumen(resultadosResumen);
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
    setInformacion("");
  };


  const extraerYAnalizarExamenesImagen = async () => {
    setCargando(true);
    setInformacion("Leyendo exámenes e interpretando exámenes 🧠🔍");
    try {
      // Analizamos los informes
      const result = await analisisImagen(texto.reduce((accumulator, currentObject) => accumulator + currentObject.text, ""));
      setImagen(result);
      setInformacion("Resumiendo interpretación 📋😎");

      // Luego resumimos todo
      const resultadosResumen = await resumirAnalisis(result);
      setResumen(resultadosResumen);
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
    setInformacion("");
  };


  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {cargando && (
        <h4>⏳ Cargando - Estado actual: {informacion} - Puede tardar de 60 a 120 segundos</h4>
      )}

      {texto.length === 0 && (
        <>
          <h4>Seleccione el tipo de archivo en el que se encuentran los exámenes</h4>
          <select value={seleccionArchivo} onChange={(e) => setSeleccionArchivo(e.target.value)}>
            <option value="">---</option>
            <option value="pdf">Archivo PDF</option>
            <option value="foto">Imagen o fotografía</option>
          </select>
          <br></br>
        </>
      )}

      {texto.length === 0 && seleccionArchivo === 'pdf' && (
        <Button variant="contained" component="label">
          <Typography>Subir PDF</Typography>
          <input type="file" accept=".pdf" hidden onChange={handlePdfUpload} />
        </Button>
      )}

      {texto.length === 0 && seleccionArchivo === 'foto' && (
        <Button variant="contained" component="label">
          <Typography>Subir IMAGENES</Typography>
          <input type="file" accept="image/*" hidden multiple onChange={handleImageUpload} />
        </Button>
      )}

      {cargandoImagen && (
        <h4>{cargandoImagen}</h4>
      )}

      {texto.length > 0 && !cargando && analisis.length === 0 && imagen.length === 0 && (
        <>
          <h4>Seleccione el tipo de exámen</h4>
          <select value={seleccionExamen} onChange={(e) => setSeleccionExamen(e.target.value)}>
            <option value="">---</option>
            <option value="laboratorio">Exámen de laboratorio</option>
            <option value="imagenes">Exámen de imágenes</option>
          </select>
          <br></br>
        </>
      )}

      {texto.length > 0 && !cargando && analisis.length === 0 && seleccionExamen === 'laboratorio' && (
        <button onClick={extraerYAnalizarExamenes}>🔍 Interpretar exámenes laboratorio</button>
      )}

      {texto.length > 0 && !cargando && imagen.length === 0 && seleccionExamen === 'imagenes' && (
        <button onClick={extraerYAnalizarExamenesImagen}>🔍 Interpretar exámenes imagen</button>
      )}

      {resumen && (
        <>
          <button onClick={handleReset}>🔄 Reiniciar</button>
          <h4>Interpretación resumida:</h4>
          {resumen}
          <h4>Interpretación detallada:</h4>
        </>
      )}

      {resumen && <p>{imagen}</p>}

      {resumen && analisis.map((elemento, index) => (
        <p key={index}>Análisis página {index + 1}: {elemento}</p>
      ))}

    </Box>
  );
};

export default App;

