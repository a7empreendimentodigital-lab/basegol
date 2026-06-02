import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/utils/api-response";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  subject: z.string().max(200).optional(),
  message: z.string().min(10).max(5000),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    await prisma.auditLog.create({
      data: {
        action: "CONTACT_FORM",
        entity: "contact",
        metadata: {
          name: body.name,
          email: body.email,
          subject: body.subject ?? "",
          message: body.message,
        },
      },
    });

    return ok({ sent: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return fail("Dados inválidos. Verifique os campos.", 400);
    }
    return fail("Não foi possível enviar a mensagem.", 500);
  }
}
