/**
 * INTEGRACIÓN DE HUELLA DACTILAR CON SOURCEAFIS (JAVA)
 *
 * Este archivo está preparado para integrar tu sistema Java de huellas dactilares
 * con el sistema web de gestión de fraternos.
 *
 * ARQUITECTURA DE INTEGRACIÓN:
 *
 * 1. CAPTURA DE HUELLA (Frontend Web):
 *    - Usa un lector de huellas compatible con WebUSB o un servicio local
 *    - Captura la imagen de la huella en formato PNG/BMP
 *    - Envía la imagen al backend para procesamiento
 *
 * 2. PROCESAMIENTO (Backend - Java con SourceAFIS):
 *    - Recibe la imagen de la huella
 *    - Extrae el template biométrico usando SourceAFIS
 *    - Devuelve el template en formato Base64 o JSON
 *    - Guarda el template en el campo 'huella_template' de la tabla fraternos
 *
 * 3. VERIFICACIÓN (Backend - Java con SourceAFIS):
 *    - Recibe una nueva huella para verificar
 *    - Compara con los templates almacenados en la base de datos
 *    - Devuelve el fraterno identificado y el score de coincidencia
 *
 * OPCIONES DE INTEGRACIÓN:
 *
 * Opción A: Servicio REST Java independiente
 * - Crea un microservicio Java con Spring Boot
 * - Expone endpoints REST para enrollment y verificación
 * - Este código Next.js llama a esos endpoints
 *
 * Opción B: Proceso Java invocado desde Node.js
 * - Usa child_process para ejecutar tu código Java
 * - Pasa datos via stdin/stdout o archivos temporales
 *
 * Opción C: JNI/Native Bridge
 * - Usa node-java-bridge para llamar directamente a clases Java
 * - Más complejo pero más integrado
 */

import { query } from "./db"
import type { Fraterno } from "./types"

// Configuración del servicio de huellas (ajusta según tu implementación)
const BIOMETRIC_SERVICE_URL = process.env.BIOMETRIC_SERVICE_URL || "http://localhost:8080/api/biometric"

/**
 * ENDPOINT 1: Enrollar huella (registrar nueva huella)
 *
 * Tu servicio Java debe exponer un endpoint POST /enroll que:
 * - Recibe: imagen de huella (multipart/form-data o base64)
 * - Procesa: extrae template con SourceAFIS
 * - Devuelve: { success: true, template: "base64_template", quality: 85 }
 */
export async function enrollFingerprint(
  fraternoId: number,
  fingerprintImage: Buffer | string,
): Promise<{ success: boolean; template?: string; error?: string }> {
  try {
    // Opción A: Llamar a servicio REST Java
    const formData = new FormData()

    if (Buffer.isBuffer(fingerprintImage)) {
      const blob = new Blob([fingerprintImage], { type: "image/png" })
      formData.append("fingerprint", blob, "fingerprint.png")
    } else {
      formData.append("fingerprint", fingerprintImage)
    }

    const response = await fetch(`${BIOMETRIC_SERVICE_URL}/enroll`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Biometric service error: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success && result.template) {
      // Guardar template en la base de datos
      await query("UPDATE fraternos SET huella_template = ?, updated_at = NOW() WHERE id = ?", [
        result.template,
        fraternoId,
      ])

      return { success: true, template: result.template }
    }

    return { success: false, error: result.error || "Failed to enroll fingerprint" }
  } catch (error) {
    console.error("[v0] Error enrolling fingerprint:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * ENDPOINT 2: Verificar huella (identificar fraterno)
 *
 * Tu servicio Java debe exponer un endpoint POST /verify que:
 * - Recibe: imagen de huella + array de templates a comparar
 * - Procesa: compara con SourceAFIS
 * - Devuelve: { success: true, matched: true, fraternoId: 123, score: 0.95 }
 */
export async function verifyFingerprint(
  fingerprintImage: Buffer | string,
  candidateIds?: number[],
): Promise<{
  success: boolean
  matched: boolean
  fraterno?: Fraterno
  score?: number
  error?: string
}> {
  try {
    // Obtener templates de candidatos (o todos si no se especifica)
    let templates: { id: number; template: string }[]

    if (candidateIds && candidateIds.length > 0) {
      templates = await query<any[]>(
        "SELECT id, huella_template as template FROM fraternos WHERE id IN (?) AND huella_template IS NOT NULL",
        [candidateIds],
      )
    } else {
      templates = await query<any[]>(
        "SELECT id, huella_template as template FROM fraternos WHERE huella_template IS NOT NULL",
      )
    }

    if (templates.length === 0) {
      return {
        success: false,
        matched: false,
        error: "No fingerprint templates found in database",
      }
    }

    // Llamar a servicio Java para verificación
    const formData = new FormData()

    if (Buffer.isBuffer(fingerprintImage)) {
      const blob = new Blob([fingerprintImage], { type: "image/png" })
      formData.append("fingerprint", blob, "fingerprint.png")
    } else {
      formData.append("fingerprint", fingerprintImage)
    }

    formData.append("templates", JSON.stringify(templates))

    const response = await fetch(`${BIOMETRIC_SERVICE_URL}/verify`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Biometric service error: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success && result.matched && result.fraternoId) {
      // Obtener datos completos del fraterno identificado
      const fraternos = await query<Fraterno[]>("SELECT * FROM fraternos WHERE id = ?", [result.fraternoId])

      if (fraternos.length > 0) {
        return {
          success: true,
          matched: true,
          fraterno: fraternos[0],
          score: result.score,
        }
      }
    }

    return {
      success: true,
      matched: false,
      error: "No match found",
    }
  } catch (error) {
    console.error("[v0] Error verifying fingerprint:", error)
    return {
      success: false,
      matched: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * ENDPOINT 3: Eliminar huella
 */
export async function deleteFingerprint(fraternoId: number): Promise<boolean> {
  try {
    await query("UPDATE fraternos SET huella_template = NULL, updated_at = NOW() WHERE id = ?", [fraternoId])
    return true
  } catch (error) {
    console.error("[v0] Error deleting fingerprint:", error)
    return false
  }
}

/**
 * EJEMPLO DE IMPLEMENTACIÓN DEL SERVICIO JAVA (Spring Boot):
 *
 * @RestController
 * @RequestMapping("/api/biometric")
 * public class BiometricController {
 *
 *     @PostMapping("/enroll")
 *     public ResponseEntity<?> enrollFingerprint(@RequestParam("fingerprint") MultipartFile file) {
 *         try {
 *             // Leer imagen
 *             BufferedImage image = ImageIO.read(file.getInputStream());
 *
 *             // Extraer template con SourceAFIS
 *             FingerprintTemplate template = new FingerprintTemplate(
 *                 new FingerprintImage()
 *                     .dpi(500)
 *                     .decode(image)
 *             );
 *
 *             // Serializar template a Base64
 *             String templateBase64 = Base64.getEncoder().encodeToString(template.toByteArray());
 *
 *             return ResponseEntity.ok(Map.of(
 *                 "success", true,
 *                 "template", templateBase64,
 *                 "quality", calculateQuality(template)
 *             ));
 *         } catch (Exception e) {
 *             return ResponseEntity.status(500).body(Map.of(
 *                 "success", false,
 *                 "error", e.getMessage()
 *             ));
 *         }
 *     }
 *
 *     @PostMapping("/verify")
 *     public ResponseEntity<?> verifyFingerprint(
 *         @RequestParam("fingerprint") MultipartFile file,
 *         @RequestParam("templates") String templatesJson
 *     ) {
 *         try {
 *             // Extraer template de la huella a verificar
 *             BufferedImage image = ImageIO.read(file.getInputStream());
 *             FingerprintTemplate probe = new FingerprintTemplate(
 *                 new FingerprintImage().dpi(500).decode(image)
 *             );
 *
 *             // Parsear templates candidatos
 *             List<Map<String, Object>> candidates = new ObjectMapper().readValue(
 *                 templatesJson,
 *                 new TypeReference<List<Map<String, Object>>>() {}
 *             );
 *
 *             // Comparar con cada template
 *             FingerprintMatcher matcher = new FingerprintMatcher(probe);
 *             double bestScore = 0;
 *             Integer bestMatch = null;
 *
 *             for (Map<String, Object> candidate : candidates) {
 *                 byte[] templateBytes = Base64.getDecoder().decode(
 *                     (String) candidate.get("template")
 *                 );
 *                 FingerprintTemplate candidateTemplate = new FingerprintTemplate(templateBytes);
 *
 *                 double score = matcher.match(candidateTemplate);
 *                 if (score > bestScore && score > 40) { // Threshold de 40
 *                     bestScore = score;
 *                     bestMatch = (Integer) candidate.get("id");
 *                 }
 *             }
 *
 *             if (bestMatch != null) {
 *                 return ResponseEntity.ok(Map.of(
 *                     "success", true,
 *                     "matched", true,
 *                     "fraternoId", bestMatch,
 *                     "score", bestScore / 100.0
 *                 ));
 *             } else {
 *                 return ResponseEntity.ok(Map.of(
 *                     "success", true,
 *                     "matched", false
 *                 ));
 *             }
 *         } catch (Exception e) {
 *             return ResponseEntity.status(500).body(Map.of(
 *                 "success", false,
 *                 "error", e.getMessage()
 *             ));
 *         }
 *     }
 * }
 */

/**
 * INSTRUCCIONES DE USO:
 *
 * 1. Configura la variable de entorno BIOMETRIC_SERVICE_URL con la URL de tu servicio Java
 * 2. Implementa los endpoints /enroll y /verify en tu servicio Java siguiendo los ejemplos
 * 3. Usa las funciones enrollFingerprint() y verifyFingerprint() desde tus API routes
 * 4. El campo huella_template en la base de datos almacenará el template en Base64
 *
 * EJEMPLO DE USO EN API ROUTE:
 *
 * // app/api/fraternos/[id]/fingerprint/route.ts
 * export async function POST(request: Request, { params }: { params: { id: string } }) {
 *   const formData = await request.formData();
 *   const fingerprintImage = await formData.get('fingerprint');
 *
 *   const result = await enrollFingerprint(
 *     parseInt(params.id),
 *     Buffer.from(await fingerprintImage.arrayBuffer())
 *   );
 *
 *   return Response.json(result);
 * }
 */
