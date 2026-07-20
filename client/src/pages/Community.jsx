import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Button, Chip, CircularProgress, TextField } from "@mui/material";
import { useSelector } from "react-redux";
import {
  createCommunityPost,
  deleteCommunityPost,
  getCommunityPosts,
} from "../api";

const Container = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 28px 16px 48px;
`;
const Wrapper = styled.div`
  width: 100%;
  max-width: 780px;
  margin: 0 auto;
`;
const Heading = styled.h1`
  margin: 0 0 6px;
  font-size: 28px;
  color: ${({ theme }) => theme.text_primary};
`;
const Intro = styled.p`
  margin: 0 0 22px;
  color: ${({ theme }) => theme.text_secondary};
`;
const Panel = styled.section`
  padding: 20px;
  margin-bottom: 18px;
  background: ${({ theme }) => theme.card};
  border: 1px solid ${({ theme }) => theme.text_primary + "1c"};
  border-radius: 16px;
  box-shadow: 0 8px 24px ${({ theme }) => theme.primary + "12"};
`;
const ComposerFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
`;
const CharacterCount = styled.span`
  color: ${({ $atLimit, theme }) => ($atLimit ? theme.red : theme.text_secondary)};
  font-size: 13px;
`;
const Feed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;
const PostCard = styled.article`
  padding: 18px 20px;
  border: 1px solid ${({ theme }) => theme.text_primary + "1c"};
  border-radius: 16px;
  background: ${({ theme }) => theme.card};
  box-shadow: 0 5px 16px ${({ theme }) => theme.primary + "0d"};
`;
const PostHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;
const Author = styled.div`
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
`;
const Time = styled.time`
  display: block;
  margin-top: 4px;
  color: ${({ theme }) => theme.text_secondary};
  font-size: 13px;
`;
const Content = styled.p`
  margin: 16px 0 0;
  color: ${({ theme }) => theme.text_primary};
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
const Empty = styled.p`
  text-align: center;
  padding: 36px 12px;
  color: ${({ theme }) => theme.text_secondary};
`;

const Community = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const token = localStorage.getItem("fittrack-app-token");
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await getCommunityPosts(token);
      setPosts(response.data?.posts ?? []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load community posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? posts.filter((post) => post.authorName.toLowerCase().includes(query)) : posts;
  }, [posts, search]);

  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Write something before posting.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      const response = await createCommunityPost(token, trimmed);
      setPosts((current) => [response.data.post, ...current]);
      setContent("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not publish your post.");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (postId) => {
    setDeletingId(postId);
    setError("");
    try {
      await deleteCommunityPost(token, postId);
      setPosts((current) => current.filter((post) => post._id !== postId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not delete this post.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container>
      <Wrapper>
        <Heading>Community</Heading>
        <Intro>Share your workouts, progress, motivation, and fitness tips.</Intro>

        <Panel>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Share with the community"
            placeholder="How is your fitness journey going today?"
            value={content}
            inputProps={{ maxLength: 500 }}
            onChange={(event) => setContent(event.target.value)}
          />
          <ComposerFooter>
            <CharacterCount $atLimit={content.length === 500}>{content.length}/500</CharacterCount>
            <Button variant="contained" onClick={handlePost} disabled={posting || !content.trim()}>
              {posting ? "Posting..." : "Post"}
            </Button>
          </ComposerFooter>
        </Panel>

        <Panel>
          <TextField
            fullWidth
            size="small"
            label="Search community"
            placeholder="Search by user or trainer name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Panel>

        {error ? <p role="alert" style={{ color: "#d32f2f" }}>{error}</p> : null}
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px" }}><CircularProgress /></div>
        ) : filteredPosts.length === 0 ? (
          <Empty>{search ? "No community members match that name." : "No posts yet. Be the first to share an update!"}</Empty>
        ) : (
          <Feed>
            {filteredPosts.map((post) => {
              const isOwner = String(post.authorId) === String(currentUser?._id) && post.role === currentUser?.role;
              return (
                <PostCard key={post._id}>
                  <PostHeader>
                    <div>
                      <Author>{post.authorName}</Author>
                      <Time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</Time>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Chip size="small" label={post.role === "trainer" ? "Trainer" : "User"} color={post.role === "trainer" ? "secondary" : "primary"} variant="outlined" />
                      {isOwner ? <Button size="small" color="error" onClick={() => handleDelete(post._id)} disabled={deletingId === post._id}>{deletingId === post._id ? "Deleting..." : "Delete"}</Button> : null}
                    </div>
                  </PostHeader>
                  <Content>{post.content}</Content>
                </PostCard>
              );
            })}
          </Feed>
        )}
      </Wrapper>
    </Container>
  );
};

export default Community;
