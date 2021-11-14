import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Divider, Icon, Input } from 'react-native-elements';
import { CommentItem } from '../../components/post';
import { DEVICE_WIDTH } from '../../constants/dimensions';
import { comment } from '../../apis';
import { useRoute } from '@react-navigation/core';

const Comment = props => {

    let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im54dHVuZyIsImlkIjoiNjE4ZDJiNzQzNjhhZDgzYTk4YzgyMGMwIiwiaWF0IjoxNjM2NzI4NTc2fQ.ZowtOOrPquHHRWKLL_l8fAWdnP1q0Qde8JkiiOsNpu0";

    const [comments, setComments] = useState([]);
    const route = useRoute();
    const postId = route.params.postId;
    const [inputComment, setInputComment] = useState("");

    useEffect(() => {
        comment.getListComment(postId, token)
        .then(result => {
            // console.log(result.data);
            const curComments = result.data.data;
            setComments(curComments);
        })
        .catch(error => {
            console.log(error)
        })
    },[route]);

    const actionAddComment = (postId, content) => {
        comment.addComment(postId, content, token)
        .then(result => {
            const newComment = result.data.data;
            // const curPost = result.data.post;
            setComments([
                ...comments,
                newComment
            ]);
            setInputComment("");
        })
        .catch(error => {
            console.log(error)
        })
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.commentList}>
                {comments.map(comment => (
                    <CommentItem
                        key={comment._id}
                        comment={comment}
                    />
                ))}
            </ScrollView>
            <View style={styles.commentSection}>
                <Icon 
                    type='feather' 
                    name='camera'
                    size={28}
                    containerStyle={{alignSelf: 'center'}} 
                    iconStyle={styles.cameraIcon}/>
                <Input 
                    placeholder="Enter your comment" 
                    multiline
                    inputContainerStyle={styles.commentInputContainer} 
                    numberOfLines={3}
                    value={inputComment}
                    onChangeText={text => setInputComment(text)}
                    rightIcon={
                        <Icon 
                            name='send' 
                            type='ionicons' 
                            size={28} 
                            iconStyle={{color: 'blue', marginLeft: 6}}
                            disabled={inputComment.length === 0}
                            onPress={() => actionAddComment(postId, inputComment)}
                        />
                    }
                    // inputStyle={{maxHeight: 60}}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    commentList: {
        marginBottom: 6
    }, 
    commentSection: {
        marginBottom: 6,
        maxHeight: 50,
        flexDirection: 'row',
    }, 
    commentInputContainer: {
        borderRadius: 20,
        borderColor: 'rgba(110, 120, 170, 1)',
        borderWidth: 1,
        width: '90%',
        paddingLeft: 10,
    },
    cameraIcon: {
        marginLeft: 6, 
        alignSelf: 'center'
    }
    
})

Comment.propTypes = {
    
};

export default Comment;