import React, {useEffect, useRef} from "react";
import {Button, Paper, Typography, Link} from "@material-ui/core";
import './Login.scss';
import {TRADITIONAL_OCL_URL} from "../../../utils/constants";
import {Field, Form, Formik} from "formik";
import * as Yup from 'yup';
import {TextField} from "formik-material-ui";

interface Props {
    onSubmit: Function,
    loading: boolean,
    status?: string,
}

const LoginSchema = Yup.object().shape({
    username: Yup.string()
        .required('Username is required'),
    password: Yup.string()
        .required('Password is required'),
});

const Login: React.FC<Props> = ({onSubmit, loading, status}) => {
    const formikRef: any = useRef(null);

    useEffect(() => {
        const {current: currentRef} = formikRef;
        if (currentRef) {
            currentRef.setSubmitting(loading);
        }
    }, [loading]);

    useEffect(() => {
        const {current: currentRef} = formikRef;
        if (currentRef) {
            currentRef.setStatus(status);
        }
    }, [status]);

    return (
        <Paper id="login-form">
            <Formik
                ref={formikRef}
                initialValues={{ username: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={({username, password}) => onSubmit(username, password)}
            >
                {({ isSubmitting, status }) => (
                    <Form>
                        <fieldset>
                            <Typography variant="h6" component="legend">
                                Log In to Open Concept Lab
                            </Typography>
                            <div className="fields">
                                <Field
                                    required
                                    fullWidth
                                    type="text"
                                    name="username"
                                    id="username"
                                    label="Username"
                                    margin="dense"
                                    variant="outlined"
                                    component={TextField}
                                />
                                <br/>

                                <Field
                                    required
                                    type="password"
                                    name="password"
                                    id="password"
                                    label="Password"
                                    margin="dense"
                                    fullWidth
                                    variant="outlined"
                                    component={TextField}
                                />
                                <br/>
                                <br/>

                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="medium"
                                    type="submit"
                                    fullWidth
                                    disabled={isSubmitting}
                                >
                                    Log in
                                </Button>
                                {!status ? <br/> : (
                                    <Typography className="status-message" color="error" variant="caption" component="span">
                                        {status}
                                    </Typography>
                                )}
                                <br/>
                                <br/>
                                <div className="other-options">
                                    <div><Link target="_blank" component="a" variant="body2" href={`${TRADITIONAL_OCL_URL}/accounts/signup/`}>Sign up</Link></div>
                                    <div><Link target="_blank" component="a" variant="body2" href={TRADITIONAL_OCL_URL}>Go to Traditional OCL</Link></div>
                                </div>
                            </div>
                        </fieldset>
                    </Form>
                )}
            </Formik>
        </Paper>
    );
};

export default Login;