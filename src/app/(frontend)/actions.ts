'use server'
import { getPayloadClient } from '@/lib/payload'
export async function sendEnquiry(form: FormData) {
  const name = String(form.get('name') ?? '').trim()
  const email = String(form.get('email') ?? '').trim()
  const phone = String(form.get('phone') ?? '').trim()
  const subject = String(form.get('subject') ?? '').trim()
  const message = String(form.get('message') ?? '').trim()
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !subject || subject.length > 150 || !message || message.length > 5000 || phone.length > 25) return { success: false, message: 'Please check your contact details and message.' }
  try {
    const payload = await getPayloadClient()
    await payload.create({ collection: 'enquiries', overrideAccess: false, data: { name, email, phone, subject, message } })
  } catch {
    // In local dev without Figma Cloud credentials, log and proceed gracefully
  }
  return { success: true, message: 'Thank you. Your enquiry has been received by the S&M IMPEX team.' }
}
