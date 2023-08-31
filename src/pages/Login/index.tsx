import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, request } from '@umijs/max';
import to from 'await-to-js';
import { isNull } from 'lodash-es';
import { message } from 'antd';
import localforage from 'localforage';

interface ILoginProps {}

const Login = (props: ILoginProps) => {
  const handleFinish = async (values: {
    username: string;
    password: string;
  }) => {
    const [err, res] = await to(
      request('/user/login', {
        method: 'post',
        data: values,
      }),
    );
    if (isNull(err)) {
      console.log(res);
      await localforage.setItem('access_token', res.accessToken);
      await localforage.setItem('refresh_token', res.refreshToken);
      await localforage.setItem('user_info', res.userInfo);
    } else {
      message.error(err?.data);
    }
  };
  return (
    <LoginForm title="会议室预定系统" subTitle="zxp" onFinish={handleFinish}>
      <ProFormText
        name="username"
        fieldProps={{
          size: 'large',
          prefix: <UserOutlined className={'prefixIcon'} />,
        }}
        placeholder={'请输入用户名'}
        rules={[
          {
            required: true,
            message: '请输入用户名!',
          },
        ]}
      />
      <ProFormText.Password
        name="password"
        fieldProps={{
          size: 'large',
          prefix: <LockOutlined className={'prefixIcon'} />,
        }}
        placeholder={'请输入密码'}
        rules={[
          {
            required: true,
            message: '请输入密码！',
          },
        ]}
      />
      <div className="flex justify-between mb-8px ">
        <Link to="/home">忘记密码</Link>
        <Link to="/register">注册账号</Link>
      </div>
    </LoginForm>
  );
};

export default Login;
