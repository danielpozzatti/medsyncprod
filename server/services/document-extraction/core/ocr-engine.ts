import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as fs from 'fs';
import { FlowDebugger } from '../utils/flow-debugger';

/**
 * Passo 1: Extração de texto via Google Vision API
 * Esta classe encapsula toda a lógica de comunicação com o Google Vision
 */
export class GoogleVisionOCREngine {
  private client: ImageAnnotatorClient;

  constructor() {
    this.client = this.createVisionClient();
  }

  /**
   * Extrai texto de uma imagem usando Google Vision API
   * @param imageBuffer Buffer da imagem
   * @returns Promise<string> Texto extraído
   */
  async extractText(imageBuffer: Buffer): Promise<string> {
    FlowDebugger.enter('ocr-engine.ts', 'extractText', { bufferSize: imageBuffer.length });
    
    try {
      console.log('🔍 Iniciando extração de texto com Google Vision API...');
      
      FlowDebugger.data('ocr-engine.ts', 'extractText', 'Chamando Google Vision API', 'textDetection');
      const [result] = await this.client.textDetection({
        image: {
          content: imageBuffer
        }
      });

      const detections = result.textAnnotations;
      FlowDebugger.data('ocr-engine.ts', 'extractText', 'Detecções recebidas', { count: detections?.length || 0 });
      
      if (!detections || detections.length === 0) {
        FlowDebugger.data('ocr-engine.ts', 'extractText', 'Resultado', 'Nenhum texto detectado');
        console.log('⚠️ Nenhum texto detectado na imagem');
        FlowDebugger.exit('ocr-engine.ts', 'extractText', '');
        return '';
      }

      const extractedText = detections[0]?.description || '';
      FlowDebugger.data('ocr-engine.ts', 'extractText', 'Texto extraído', { length: extractedText.length, preview: extractedText.substring(0, 100) });
      console.log('✅ Texto extraído com sucesso');
      console.log('📝 Tamanho do texto:', extractedText.length, 'caracteres');
      
      FlowDebugger.exit('ocr-engine.ts', 'extractText', { textLength: extractedText.length });
      return extractedText;
    } catch (error) {
      FlowDebugger.error('ocr-engine.ts', 'extractText', error);
      console.error('❌ Erro na extração de texto:', error);
      throw new Error(`Falha na extração de texto: ${error}`);
    }
  }

  /**
   * Configura cliente do Google Vision com as credenciais
   */
  private createVisionClient(): ImageAnnotatorClient {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    if (!credentials) {
      throw new Error('❌ Credenciais do Google Cloud não encontradas');
    }

    // Se as credenciais são JSON, criar arquivo temporário
    if (credentials.startsWith('{')) {
      const tempPath = '/tmp/google-credentials.json';
      fs.writeFileSync(tempPath, credentials);
      
      return new ImageAnnotatorClient({
        keyFilename: tempPath
      });
    }
    
    // Se é um caminho de arquivo, usar diretamente
    return new ImageAnnotatorClient({
      keyFilename: credentials
    });
  }
}
