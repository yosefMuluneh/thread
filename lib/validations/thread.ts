import * as z from "zod";

export const ThreadValidation = z.object({
    thread: z.string().max(5000, { message: "Maximum 5000 characters" }),
    accountId: z.string()
});

export const CommentValidation = z.object({
    thread: z.string().min(3, { message: "Minimum three characters" }),
});

export const SearchValidation = z.object({
    entity: z.string().min(1, { message: "Minimum three characters" }),
});
