import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { Avatar, Button, Divider, Icon, Image, ListItem, Text } from 'react-native-elements';
import { PostList } from '../post';
import { DEVICE_WIDTH } from '../../constants/dimensions';
import { post } from '../../apis'

const Profile = props => {

    let token ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InR1bmdueCIsImlkIjoiNjE4MTA5NDk2YmRjYzkyZGIwNDU1MDEyIiwiaWF0IjoxNjM2Mzc3ODgyfQ.PERJlxqWua9oaUhed9pywKdrKc-lyVwWCnLitQtvPjY';

    const [data, setData] = useState();
    useEffect(() => {
        post.getListPost(null, token)
        .then((result)=> {
            setData({
                ...data,
                // image: result.data.data.image,
                // video: result.data.data.video,
                like: result.data.data.like,
                countComments: result.data.data.countComments,
                author:{
                    userName: result.data.data.author.username,
                    avatar: result.data.data.author.avatar.fileName
                },
                described: result.data.data.described,
                time: result.data.data.createdAt,
            })
        })
        .catch((error) => {
            console.log();
        });
    },[]);

    return (
		<ScrollView showsHorizontalScrollIndicator={false}>
            <View>
                <ImageBackground 
                    source={{
                        uri: "https://wallpaperaccess.com/full/317501.jpg",
                    }}
                    alt="This is cover image"
                    style={styles.cover}
                >
                    <Icon type='feather' name='more-horizontal' size={32} style={{marginRight: 6, marginTop: 6}}/>
                </ImageBackground>
                <View style={styles.profileOutterContainer}>
                    <View style={styles.profileInnerContainer}>
                        <Avatar
                            rounded
                            size='large'
                            source={{
                                uri: "https://i.etsystatic.com/29282700/r/il/e3aae5/3152845862/il_340x270.3152845862_q44u.jpg",
                            }}
                            onPress={() => console.log('Pressed on avatar!')}
                        />
                    </View>
                </View>
                <Text style={styles.name}> Quân Hoàng </Text>
                
                <View style={styles.buttonGroupContainer}>
                    <View style={styles.buttonGroup}>   
                        <Button 
                            title='Add friend' 
                            icon={{
                                type:'ionicons', 
                                name: "person-add",
                                
                            }}
                        />
                        <Button 
                            title='Message' 
                            icon={{
                                type:'ant-design', 
                                name: "message1",
                                
                            }}
                        />
                    </View>
                </View>

                <TouchableOpacity>    
                    <ListItem>
                        <Icon type='font-awesome-5' name='user-friends'/>
                        <ListItem.Content>
                            <ListItem.Title>Friends</ListItem.Title>
                            <ListItem.Subtitle>177 friends</ListItem.Subtitle>
                        </ListItem.Content> 
                        <ListItem.Chevron color='black'/>
                    </ListItem>
                </TouchableOpacity>

                <PostList/>
            </View>
		</ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
    },
    cover: {
        width: DEVICE_WIDTH,
        height: 256,
        alignItems: 'flex-end',
    }, 
    profileOutterContainer: {
        alignItems: 'center',
        marginBottom: 6,
        position: 'relative'
    },
    profileInnerContainer: {
        marginTop: -50, 
        // width: "fit-content"
    },
    
    name: {
        textAlign: "center", 
        fontSize: 24,
        fontWeight: 'bold'
    }, 
    buttonGroupContainer: {
        alignItems: 'center',
    },
    buttonGroup: {
        width: '65%',
        flexDirection: 'row', 
        marginVertical: 10, 
        marginHorizontal: 4,
        justifyContent: 'space-between'
    }

});

Profile.propTypes = {
    
};

export default Profile;