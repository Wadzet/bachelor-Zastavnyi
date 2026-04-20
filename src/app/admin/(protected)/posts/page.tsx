import { getAdminPosts } from "@/lib/data/admin"
import PostsClient from "@/components/admin/PostsClient"

// Revalidate every 60 seconds — keeps the post list and Telegram status fresh.
export const revalidate = 60

export default async function AdminPostsPage() {
  const posts = await getAdminPosts()
  return <PostsClient posts={posts} />
}
