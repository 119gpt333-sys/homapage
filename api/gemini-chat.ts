import type { VercelRequest, VercelResponse } from '@vercel/node'
import { GoogleGenAI } from '@google/genai'

type Role = 'user' | 'assistant'

interface IncomingMessage {
  role: Role
  content: string
}

interface Body {
  messages: IncomingMessage[]
}

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn('[Gemini] GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.')
}

const SYSTEM_INSTRUCTION =
  '당신은 서울특별시 소방재난본부의 "서울소방 GPT"입니다. ' +
  '현장 활동, 장비 운용, 화재 예방, 교육·연구와 관련된 질문에 답변합니다. ' +
  '항상 한국어로 답변하며, 실제 사고 대응·의사결정 전에 반드시 서울소방 공식 지침과 상급자의 확인이 필요하다는 점을 분명히 알립니다. ' +
  '모르는 내용은 아는 척하지 말고, 공식 자료 확인을 권고하세요.'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' })
  }

  const body = req.body as Body | undefined

  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'messages가 필요합니다.' })
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const contents = body.messages.map((m) => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: m.content }],
    }))

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    })

    const text = response.text ?? ''

    return res.status(200).json({ reply: text })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Gemini] error', error)
    return res
      .status(500)
      .json({ error: 'Gemini 호출 중 오류가 발생했습니다.' })
  }
}
